import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabaseAdmin } from '@/lib/radarSupabase'

// Location text to country code mapping
const LOCATION_MAP: Record<string, string> = {
  '日本': 'JP', 'japan': 'JP', 'tokyo': 'JP', '東京': 'JP', 'osaka': 'JP', '大阪': 'JP',
  'usa': 'US', 'united states': 'US', 'new york': 'US', 'los angeles': 'US', 'california': 'US',
  'korea': 'KR', '韓国': 'KR', 'seoul': 'KR',
  'taiwan': 'TW', '台湾': 'TW', 'taipei': 'TW',
  'thailand': 'TH', 'bangkok': 'TH',
  'vietnam': 'VN', 'hanoi': 'VN',
  'philippines': 'PH', 'manila': 'PH',
  'indonesia': 'ID', 'jakarta': 'ID',
  'malaysia': 'MY', 'kuala lumpur': 'MY',
  'singapore': 'SG',
  'india': 'IN', 'mumbai': 'IN', 'delhi': 'IN',
  'china': 'CN', '中国': 'CN', 'beijing': 'CN', 'shanghai': 'CN',
  'uk': 'GB', 'united kingdom': 'GB', 'london': 'GB', 'england': 'GB',
  'germany': 'DE', 'berlin': 'DE',
  'france': 'FR', 'paris': 'FR',
  'brazil': 'BR', 'são paulo': 'BR',
  'nigeria': 'NG', 'lagos': 'NG',
  'turkey': 'TR', 'istanbul': 'TR',
  'uae': 'AE', 'dubai': 'AE',
  'australia': 'AU', 'sydney': 'AU', 'melbourne': 'AU',
  'canada': 'CA', 'toronto': 'CA', 'vancouver': 'CA',
}

function guessCountry(location: string | null): string | null {
  if (!location) return null
  const lower = location.toLowerCase()
  for (const [key, code] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) return code
  }
  return null
}

function calcScore(user: any, posts: any[]) {
  const periodPosts = posts.length
  const periodLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0)
  const periodRetweets = posts.reduce((s, p) => s + (p.retweet_count || 0), 0)
  const periodReplies = posts.reduce((s, p) => s + (p.reply_count || 0), 0)
  const countries = new Set(posts.map(p => p.country_code).filter(Boolean))

  const followerScore = Math.min(user.followers_count || 0, 100000) * 0.003
  const postScore = periodPosts * 10
  const likeScore = periodLikes * 2
  const rtScore = periodRetweets * 5
  const replyScore = periodReplies * 3
  const intlBonus = countries.size > 1 ? countries.size * 5 : 0

  return {
    score: Math.round(followerScore + postScore + likeScore + rtScore + replyScore + intlBonus),
    follower_score: Math.round(followerScore),
    post_score: postScore,
    like_score: likeScore,
    rt_score: rtScore,
    reply_score: replyScore,
    intl_bonus: intlBonus,
    period_posts: periodPosts,
    period_likes: periodLikes,
    period_retweets: periodRetweets,
    period_replies: periodReplies,
    intl_reach_countries: countries.size,
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getRadarSupabaseAdmin()
  const token = process.env.TWITTER_BEARER_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'TWITTER_BEARER_TOKEN not set' }, { status: 500 })
  }

  // Get active events and their hashtags
  const now = new Date().toISOString()
  const { data: events } = await db
    .from('events')
    .select('*')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  if (!events || events.length === 0) {
    return NextResponse.json({ message: 'No active events', collected: 0 })
  }

  let totalCollected = 0

  for (const event of events) {
    const hashtags = (event.hashtags || []) as string[]
    if (hashtags.length === 0) continue

    const query = hashtags.map(h => h.replace('#', '%23')).join(' OR ')
    const startTime = new Date(Date.now() - 3600000).toISOString() // 1 hour ago

    try {
      const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(hashtags.join(' OR '))}&tweet.fields=public_metrics,author_id,created_at,lang,geo&expansions=author_id&user.fields=public_metrics,location,profile_image_url&max_results=100&start_time=${startTime}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        console.error(`X API error: ${res.status} ${await res.text()}`)
        continue
      }

      const json = await res.json()
      const tweets = json.data || []
      const users = json.includes?.users || []
      const userMap = new Map(users.map((u: any) => [u.id, u]))

      // Upsert X users
      for (const u of users) {
        const country = guessCountry(u.location)
        await db.from('radar_x_users').upsert({
          x_id: u.id,
          username: u.username,
          display_name: u.name,
          followers_count: u.public_metrics?.followers_count || 0,
          tweet_count: u.public_metrics?.tweet_count || 0,
          location: u.location,
          profile_image_url: u.profile_image_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'x_id' })
      }

      // Upsert tweets
      for (const tweet of tweets) {
        const author = userMap.get(tweet.author_id) as any
        const countryCode = guessCountry(author?.location) || (tweet.lang === 'ja' ? 'JP' : null)

        await db.from('radar_posts').upsert({
          tweet_id: tweet.id,
          event_id: event.id,
          author_id: tweet.author_id,
          text: tweet.text,
          lang: tweet.lang,
          like_count: tweet.public_metrics?.like_count || 0,
          retweet_count: tweet.public_metrics?.retweet_count || 0,
          reply_count: tweet.public_metrics?.reply_count || 0,
          quote_count: tweet.public_metrics?.quote_count || 0,
          country_code: countryCode,
          created_at: tweet.created_at,
        }, { onConflict: 'tweet_id' })

        totalCollected++
      }

      // Recalculate scores for this event
      const { data: allPosts } = await db
        .from('radar_posts')
        .select('*')
        .eq('event_id', event.id)

      // Group posts by author
      const postsByAuthor = new Map<string, any[]>()
      for (const p of allPosts || []) {
        const arr = postsByAuthor.get(p.author_id) || []
        arr.push(p)
        postsByAuthor.set(p.author_id, arr)
      }

      // Calculate and upsert scores
      for (const [authorId, authorPosts] of postsByAuthor) {
        const { data: user } = await db
          .from('radar_x_users')
          .select('*')
          .eq('x_id', authorId)
          .single()

        if (!user) continue

        const scores = calcScore(user, authorPosts)
        await db.from('radar_scores').upsert({
          event_id: event.id,
          x_id: authorId,
          ...scores,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'event_id,x_id' })
      }

      // Update ranks
      const { data: allScores } = await db
        .from('radar_scores')
        .select('id, score')
        .eq('event_id', event.id)
        .order('score', { ascending: false })

      if (allScores) {
        for (let i = 0; i < allScores.length; i++) {
          await db.from('radar_scores').update({ rank: i + 1 }).eq('id', allScores[i].id)
        }
      }

    } catch (err) {
      console.error('Radar collect error:', err)
    }
  }

  return NextResponse.json({ message: 'OK', collected: totalCollected })
}
