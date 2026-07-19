import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import type { CommunityPlan } from '../services/communityData'
import { useT } from '../i18n/context'

interface Props {
  plans: CommunityPlan[]
  counts: Record<string, number>
  votedIds: Set<string>
  onToggleVote: (planId: string) => void
  onTryPlan: (plan: CommunityPlan) => void
}

/**
 * Le schede proposte dalla community: ordinate per voti (come gli esercizi), con lo stesso
 * gesto di upvote e «Prova questa scheda» che le importa tra le proprie (stesso motore
 * della condivisione: esercizi incorporati, dedup sul media).
 */
export function CommunityPlanList({ plans, counts, votedIds, onToggleVote, onTryPlan }: Props) {
  const t = useT()

  if (plans.length === 0) {
    return (
      <Typography color="text.secondary" data-cy="community-plans-empty">
        {t('community.plansEmpty')}
      </Typography>
    )
  }

  const sorted = [...plans].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))

  return (
    <Stack spacing={2} data-cy="community-plan-list">
      {sorted.map((plan) => {
        const voted = votedIds.has(plan.id)
        const exerciseCount = plan.days.reduce((n, day) => n + day.entries.length, 0)
        return (
          <Card key={plan.id} variant="outlined" data-cy="community-plan-item">
            <CardContent>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Typography variant="h3" component="h3" sx={{ pt: 0.5 }}>
                  {plan.name}
                </Typography>
                {/* Stessa colonnina di voto degli esercizi: un voto per dispositivo, toggle */}
                <Button
                  size="small"
                  variant={voted ? 'contained' : 'outlined'}
                  className={voted ? 'vote-button voted' : 'vote-button'}
                  data-cy="plan-upvote"
                  aria-pressed={voted}
                  aria-label={
                    voted
                      ? t('list.removeVote', { name: plan.name })
                      : t('list.vote', { name: plan.name })
                  }
                  onClick={() => onToggleVote(plan.id)}
                  sx={{
                    flexDirection: 'column',
                    gap: 0,
                    minWidth: 52,
                    px: 0.5,
                    py: 0.75,
                    borderRadius: '14px',
                    flexShrink: 0,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Box component="span" aria-hidden sx={{ fontSize: '0.75rem' }}>
                    ▲
                  </Box>
                  <span data-cy="plan-votes">{counts[plan.id] ?? 0}</span>
                </Button>
              </Stack>
              <Chip
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
                label={t('community.planSummary', {
                  days: plan.days.length,
                  exercises: exerciseCount,
                })}
              />
              <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                {plan.days.map((day) => (
                  <Typography key={day.name} variant="body2" color="text.secondary">
                    <Box component="strong" sx={{ color: 'text.primary' }}>
                      {day.name}
                    </Box>
                    {day.entries.length > 0 &&
                      ` — ${day.entries
                        .map((entry) => `${entry.exercise.name} ${entry.sets}×${entry.reps}`)
                        .join(', ')}`}
                  </Typography>
                ))}
              </Stack>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrowIcon />}
                data-cy="community-plan-try"
                onClick={() => onTryPlan(plan)}
                sx={{ mt: 2 }}
              >
                {t('import.tryPlan')}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}
