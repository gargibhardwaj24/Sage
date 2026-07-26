import { Field, Input, Switch, Textarea } from '@/components/ui/Field'
import { ClockInput, MinutesSelect, SheetPanel } from '@/components/methods/sheetControls'
import { parseClock } from '@/lib/worksheet'
import { addMinutes, atTime, fmtTimeShort, humanDuration } from '@/lib/date'

export function FrogSheet({ sheet, state, onChange }) {
  const { hour, minute } = parseClock(state.start)
  const start = atTime(new Date(), hour, minute)
  const end = addMinutes(start, state.minutes)
  const rewardEnabled = state.rewardEnabled !== false

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-start">
      <SheetPanel
        title="The frog"
        hint="One sentence. If it needs a plan, planning it is the frog."
      >
        <div className="space-y-4">
          <Textarea
            value={state.frog}
            onChange={(e) => onChange({ frog: e.target.value })}
            rows={2}
            placeholder="The task you would most like to postpone."
            aria-label="The frog"
            className="resize-y text-body-lg"
          />

          <Field
            label="Why I am avoiding it"
            htmlFor="frog-avoiding"
            hint="stays on the sheet"
          >
            <Textarea
              id="frog-avoiding"
              value={state.avoiding}
              onChange={(e) => onChange({ avoiding: e.target.value })}
              rows={3}
              placeholder="Boring? Ambiguous? Someone might say no?"
              className="resize-y"
            />
          </Field>

          <Field
            label="First physical action"
            htmlFor="frog-action"
            hint="goes on the block"
          >
            <Input
              id="frog-action"
              value={state.firstAction}
              onChange={(e) => onChange({ firstAction: e.target.value })}
              placeholder="Open the file. Draft the subject line. Dial the number."
            />
          </Field>
        </div>
      </SheetPanel>

      <div className="space-y-5">
        <SheetPanel title="When" hint="First thing, before the day starts negotiating with you.">
          <div className="flex flex-wrap items-center gap-2">
            <ClockInput
              value={state.start}
              onChange={(value) => onChange({ start: value || sheet.start })}
              label="Frog start time"
            />
            <MinutesSelect
              value={state.minutes}
              onChange={(minutes) => onChange({ minutes })}
              label="Frog length"
            />
          </div>
          <p className="mt-3 text-label-sm text-faint">
            {fmtTimeShort(start)} – {fmtTimeShort(end)} · {humanDuration(state.minutes)} protected
          </p>
        </SheetPanel>

        <SheetPanel
          title="Reward"
          hint={`Straight after the frog, ${humanDuration(sheet.reward.minutes)} of something better.`}
          action={
            <Switch
              checked={rewardEnabled}
              onChange={(v) => onChange({ rewardEnabled: v })}
              label="Schedule a reward"
            />
          }
        >
          <Input
            value={state.rewardTitle}
            onChange={(e) => onChange({ rewardTitle: e.target.value })}
            disabled={!rewardEnabled}
            placeholder="Reward & reset"
            aria-label="Reward"
            className="disabled:opacity-40"
          />
        </SheetPanel>
      </div>
    </div>
  )
}

export default FrogSheet
