import { InvitationExperience } from '@/components/invitation/InvitationExperience'
import { openingSeenScript } from '@/components/invitation/opening-seen'
import { getEventConfig } from '@/lib/config'
import { formatEventDate } from '@/lib/date'

export default function Page() {
  const config = getEventConfig()
  const date = formatEventDate(config.event.startsAt, config.event.timeZone)

  return (
    <>
      {/* Must precede the invitation in the HTML: it has to run before the overlay paints. */}
      <script dangerouslySetInnerHTML={{ __html: openingSeenScript }} />
      <InvitationExperience
        monogram={config.celebrant.monogram}
        celebrantName={config.celebrant.name}
        age={config.celebrant.age}
        poster={config.theme.poster}
        videoSrc={config.media.openingVideo}
        date={date}
      />
    </>
  )
}
