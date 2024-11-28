import fs from 'node:fs';

/**
 * @var {string[]}
 */
const HEADERS_ORDER = [
    'Project-Id-Version',
    'Report-Msgid-Bugs-To',
    'POT-Creation-Date',
    'PO-Revision-Date',
    'Last-Translator',
    'Language-Team',
    'Language',
    'MIME-Version',
    'Content-Type',
    'Content-Transfer-Encoding',
    'Plural-Forms',
];

const FIXHEADERS = {
    it(poFile) {
        poFile.setHeader('Plural-Forms', 'nplurals=2; plural=(n != 1);', true);
        poFile.setHeader('Project-Id-Version', 'Italian localization', true);
        poFile.setHeader('Report-Msgid-Bugs-To', '', false);
    },
};

class POFile
{
    /**
     * @type {string[]}
     */
    #initialComments;

    /**
     * @type {string[]}
     */
    #headers;

    /**
     * @type {string[]}
     */
    #body;

    /**
     * @type {bool}
     */
    #isPOT;

    /**
     * @type {string[]}
     */
    get initialComments()
    {
        return this.#initialComments;
    }

    /**
     * @type {string[]}
     */
    get headers()
    {
        return this.#headers;
    }

    /**
     * @type {string[]}
     */
    get body()
    {
        return this.#body;
    }

    /**
     * @type {bool}
     */
    get isPOT()
    {
        return this.#isPOT;
    }

    /**
     * @type {string} empty string if POT
     */
    get languageID()
    {
        if (this.#isPOT) {
            return '';
        }
        let result = null;
        this.#headers.map((header) => {
            const match = /^Language:\s*(\w([\w\-]*\w)?)(\s|$)/i.exec(header);
            if (!match) {
                return;
            }
            if (result !== null) {
                throw new Error('More than one Language headers found!');
            }
            result = match[1];
        });
        if (result === null) {
            throw new Error('No Language headers found!');
        }
        return result;
    }

    /**
     * @param {string[]} initialComments
     * @param {string[]} headers
     * @param {string[]} body
     * @param {bool} isPOT
     */
    constructor(initialComments, headers, body, isPOT)
    {
        this.#initialComments = initialComments;
        this.#headers = headers;
        this.#body = body;
        this.#isPOT = isPOT ? true : false;
    }

    /**
     * @param {string} po
     * @param {bool} isPOT
     *
     * @returns {POFile}
     */
    static fromString(po, isPOT = false)
    {
        const lines = po.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n').map((line) => line.startsWith('#') ? line : line.trim());
        if (lines[lines.length - 1] !== '') {
            lines.push('');
        }
        const initialComments = [];
        const headerLines = [];
        const body = [];
        let state = 0;
        while (lines.length > 0) {
            let line = lines.shift();
            if (line.startsWith('msgid')) {
                state++;
                if (state === 1) {
                    if (!/^msgid\s+""$/.test(line)) {
                        throw new Error('Error parsing the .po data (missing header)');
                    }
                    while (lines.length > 0 && lines[0].trim() === '') {
                        lines.shift();
                    }
                    line = lines.shift();
                    if (!line || !/^msgstr(\s+"|\s*$)/.test(line)) {
                        throw new Error('Error parsing the .po data (malformed header)');
                    }
                    line = line.replace(/^msgstr\s*/, '');
                }
            } else if (state === 1 && (line.startsWith('#') || line.startsWith('msgid'))) {
                state++;
            }
            switch(state) {
                case 0:
                    if (line.trim() !== '') {
                        initialComments.push(line);
                    }
                    break;
                case 1:
                    if (line !== '' && line !== '""') {
                        if (line.length <= 2 || !line.startsWith('"') || !line.endsWith('"')) {
                            throw new Error('Error parsing the .po data (malformed header)');
                        }
                        headerLines.push(line.slice(1, -1));
                    }
                    break;
                default:
                    body.push(line, ...lines);
                    lines.length = 0;
                    break;
            }
        }
        if (headerLines.length === 0 || body.length === 0) {
            throw new Error('Error parsing the .po data');
        }
        return new POFile(
            initialComments,
            headerLines.join('').split('\\n').filter((line) => line !== ''),
            body,
            isPOT,
        );
    }

    /**
     * @param {string} poPath
     * @param {bool} isPOT
     *
     * @returns {POFile}
     */
    static fromFile(poPath, isPOT = false)
    {
        const po = fs.readFileSync(poPath, {encoding: 'utf8'});
        return POFile.fromString(po, isPOT);
    }

    /**
     * @param {POFile} other
     *
     * @returns {boolean}
     */
    sameStrings(other)
    {
        const extractBody = function(poFile) {
            const bodyLines = poFile.clone().#fixStrings().#body;
            const messageLines = bodyLines.filter((line) => /^(\w|")/.test(line));
            return messageLines.join('\n');
        };
        return extractBody(this) === extractBody(other);
    }

    /**
     * @returns {POFile}
     */
    clone()
    {
        return new POFile(
            [].concat(this.#initialComments),
            [].concat(this.#headers),
            [].concat(this.#body),
            this.#isPOT,
        );
    }

    /**
     * @returns {POFile}
     */
    normalize()
    {
        return this
            .#fixHeaders()
            .#sortHeaders()
            .#fixReferences()
            .#fixStrings()
        ;
    }

    /**
     * @returns {string}
     */
    toString()
    {
        const result = [];
        result.push(...this.#initialComments);
        result.push('msgid ""');
        result.push('msgstr ""');
        this.#headers.map((header) => result.push('"' + header + '\\n"'));
        result.push('');
        result.push(...this.#body);
        return result.join('\n');
    }

    /**
     * @param {string} name
     * @param {string} newValue
     * @param {bool} overwrite
     *
     * @returns {POFile}
     */
    setHeader(name, newValue, overwrite)
    {
        const search = name.toLowerCase() + ':'
        const result = [];
        let found = false;
        for (const line of this.#headers) {
            if (!found && line.toLowerCase().startsWith(search)) {
                if (!overwrite) {
                    return;
                }
                result.push(name + ': ' + newValue);
                found = true;
            } else {
                result.push(line);
            }
        }
        if (!found) {
            result.push(name + ': ' + newValue);
        }
        this.#headers = result;
        return this;
    }

    /**
     * @returns {POFile}
     */
    #sortHeaders()
    {
        const order = [].concat(HEADERS_ORDER);
        let processingHeaders = [].concat(this.#headers);
        const newHeadrs = [];
        while (order.length > 0) {
            const search = order.shift().toLowerCase() + ':';
            processingHeaders = processingHeaders.filter((header) => {
                if (header.toLowerCase().startsWith(search)) {
                    newHeadrs.push(header);
                    return false;
                }
                return true;
            });
        }
        newHeadrs.push(...processingHeaders);
        this.#headers = newHeadrs;
        return this;
    }

    /**
     * @returns {POFile}
     */
    #fixHeaders()
    {
        if (!this.isPOT) {
            this.setHeader('PO-Revision-Date', (new Date()).toISOString().replace('T', ' ').replace(/:[^:]+$/, '+0000'), false);
            const languageID = this.languageID;
            if (FIXHEADERS.hasOwnProperty(languageID)) {
                FIXHEADERS[languageID](this);
            }
        }
        return this;
    }

    /**
     * @returns {POFile}
     */
    #fixReferences()
    {
        this.#body = this.#body.flatMap((line) => {
            if (!line.startsWith('#: ')) {
                return line;
            }
            const splitted = [];
            line = line.replace(/^#:\s+/, '');
            let match;
            while (match = /^(.*?:\d+)\s+(\S.*)/.exec(line)) {
                splitted.push('#: ' + match[1]);
                line = match[2];
            }
            splitted.push('#: ' + line);
            return splitted;
        });
        return this;
    }

    /**
     * @returns {POFile}
     */
    #fixStrings()
    {
        const processing = [].concat(this.#body);
        const newBody = [];
        while (processing.length > 0) {
            let line = processing.shift();
            if (line.endsWith('"') && /^(msg\w+\s+|)?"/.test(line)) {
                while (processing.length > 0 && processing[0].startsWith('"')) {
                    line = line.slice(0, -1) + processing.shift().slice(1);
                }
            }
            newBody.push(line);
        }
        this.#body = newBody;
        return this;
    }
}

export default POFile;
