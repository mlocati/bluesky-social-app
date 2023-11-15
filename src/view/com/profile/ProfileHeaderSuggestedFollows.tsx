import React from 'react'
import {View, StyleSheet, Pressable, ScrollView} from 'react-native'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import * as Toast from '../util/Toast'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Button} from 'view/com/util/forms/Button'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {Link} from 'view/com/util/Link'
import {useAnalytics} from 'lib/analytics/analytics'
import {isWeb} from 'platform/detection'
import {useModerationOpts} from '#/state/queries/preferences'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {
  useProfileFollowMutation,
  useProfileUnfollowMutation,
} from '#/state/queries/profile'

const OUTER_PADDING = 10
const INNER_PADDING = 14
const TOTAL_HEIGHT = 250

export function ProfileHeaderSuggestedFollows({
  actorDid,
  active,
  requestDismiss,
}: {
  actorDid: string
  active: boolean
  requestDismiss: () => void
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const animatedHeight = useSharedValue(0)
  const animatedStyles = useAnimatedStyle(() => ({
    opacity: animatedHeight.value / TOTAL_HEIGHT,
    height: animatedHeight.value,
  }))

  React.useEffect(() => {
    if (active) {
      track('ProfileHeader:SuggestedFollowsOpened')

      animatedHeight.value = withTiming(TOTAL_HEIGHT, {
        duration: 500,
        easing: Easing.inOut(Easing.exp),
      })
    } else {
      animatedHeight.value = withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.exp),
      })
    }
  }, [active, animatedHeight, track])

  const {isLoading, data, dataUpdatedAt} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })

  return (
    <Animated.View style={[{overflow: 'hidden', opacity: 0}, animatedStyles]}>
      <View style={{paddingVertical: OUTER_PADDING}}>
        <View
          style={{
            backgroundColor: pal.viewLight.backgroundColor,
            height: '100%',
            paddingTop: INNER_PADDING / 2,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 4,
              paddingBottom: INNER_PADDING / 2,
              paddingLeft: INNER_PADDING,
              paddingRight: INNER_PADDING / 2,
            }}>
            <Text type="sm-bold" style={[pal.textLight]}>
              Suggested for you
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={requestDismiss}
              hitSlop={10}
              style={{padding: INNER_PADDING / 2}}>
              <FontAwesomeIcon
                icon="x"
                size={12}
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </Pressable>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={isWeb}
            persistentScrollbar={true}
            scrollIndicatorInsets={{bottom: 0}}
            scrollEnabled={true}
            contentContainerStyle={{
              alignItems: 'flex-start',
              paddingLeft: INNER_PADDING / 2,
              paddingBottom: INNER_PADDING,
            }}>
            {isLoading ? (
              <>
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
              </>
            ) : data ? (
              data.suggestions.map(profile => (
                <SuggestedFollow
                  key={profile.did}
                  profile={profile}
                  dataUpdatedAt={dataUpdatedAt}
                />
              ))
            ) : (
              <View />
            )}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  )
}

function SuggestedFollowSkeleton() {
  const pal = usePalette('default')
  return (
    <View
      style={[
        styles.suggestedFollowCardOuter,
        {
          backgroundColor: pal.view.backgroundColor,
        },
      ]}>
      <View
        style={{
          height: 60,
          width: 60,
          borderRadius: 60,
          backgroundColor: pal.viewLight.backgroundColor,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          height: 17,
          width: 70,
          borderRadius: 4,
          backgroundColor: pal.viewLight.backgroundColor,
          marginTop: 12,
          marginBottom: 4,
        }}
      />
      <View
        style={{
          height: 12,
          width: 70,
          borderRadius: 4,
          backgroundColor: pal.viewLight.backgroundColor,
          marginBottom: 12,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          height: 32,
          borderRadius: 32,
          width: '100%',
          backgroundColor: pal.viewLight.backgroundColor,
        }}
      />
    </View>
  )
}

function SuggestedFollow({
  profile: profileUnshadowed,
  dataUpdatedAt,
}: {
  profile: AppBskyActorDefs.ProfileView
  dataUpdatedAt: number
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const moderationOpts = useModerationOpts()
  const profile = useProfileShadow(profileUnshadowed, dataUpdatedAt)
  const followMutation = useProfileFollowMutation()
  const unfollowMutation = useProfileUnfollowMutation()

  const onPressFollow = React.useCallback(async () => {
    if (profile.viewer?.following) {
      return
    }
    try {
      track('ProfileHeader:SuggestedFollowFollowed')
      await followMutation.mutateAsync({did: profile.did})
    } catch (e: any) {
      Toast.show('An issue occurred, please try again.')
    }
  }, [followMutation, profile, track])

  const onPressUnfollow = React.useCallback(async () => {
    if (!profile.viewer?.following) {
      return
    }
    try {
      await unfollowMutation.mutateAsync({
        did: profile.did,
        followUri: profile.viewer?.following,
      })
    } catch (e: any) {
      Toast.show('An issue occurred, please try again.')
    }
  }, [unfollowMutation, profile])

  if (!moderationOpts) {
    return null
  }
  const moderation = moderateProfile(profile, moderationOpts)
  const following = profile.viewer?.following
  return (
    <Link
      href={makeProfileLink(profile)}
      title={profile.handle}
      asAnchor
      anchorNoUnderline>
      <View
        style={[
          styles.suggestedFollowCardOuter,
          {
            backgroundColor: pal.view.backgroundColor,
          },
        ]}>
        <UserAvatar
          size={60}
          avatar={profile.avatar}
          moderation={moderation.avatar}
        />

        <View style={{width: '100%', paddingVertical: 12}}>
          <Text
            type="xs-medium"
            style={[pal.text, {textAlign: 'center'}]}
            numberOfLines={1}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.profile,
            )}
          </Text>
          <Text
            type="xs-medium"
            style={[pal.textLight, {textAlign: 'center'}]}
            numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
        </View>

        <Button
          label={following ? 'Unfollow' : 'Follow'}
          type="inverted"
          labelStyle={{textAlign: 'center'}}
          onPress={following ? onPressUnfollow : onPressFollow}
          withLoading
        />
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  suggestedFollowCardOuter: {
    marginHorizontal: INNER_PADDING / 2,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 130,
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 1,
  },
})
