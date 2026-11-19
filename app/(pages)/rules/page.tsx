import {
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Clock,
  GraduationCap,
  HeartPulse,
  Smile,
  TrendingUp,
} from "lucide-react";
import {
  DEFAULT_GOALS,
  DOCTOR_BILL,
  DOCTOR_TIME_LOST,
  EXHAUSTED_BELOW,
  EXHAUSTED_FACTOR,
  HEALTH_GOAL,
  INTEREST_RATE,
  MISSED_MEAL_ENERGY_LOSS,
  MISSED_MEAL_HEALTH_LOSS,
  RENT_INTERVAL_WEEKS,
  SHIFT_TIME,
  SLEEP_ENERGY,
  STARTING_CASH,
  TIRED_BELOW,
  TIRED_FACTOR,
  WEEK_LENGTH,
  WEEKLY_ENERGY_RECOVERY,
  WORK_ENERGY_COST,
} from "@/lib/game/engine";
import { findJob, jobs, type Job } from "@/lib/game/data/jobs";
import {
  apartmentTiers,
  SUBJECTS,
  subjectName,
  subjectTuition,
} from "@/lib/game/data/services";
import {
  Badge,
  Block,
  Body,
  Bullet,
  Bullets,
  ChipList,
  DataTable,
  Hero,
  Needs,
  Note,
  Num,
  Pay,
  RulesShell,
  Section,
  SubHead,
  Tile,
  TileGrid,
  type Col,
  type TableRow,
} from "@/app/components/game/RulesUi";

// ── Helpers: everything below is derived from the game data, so this page
//    never goes out of date when jobs or subjects are added or changed. ─────
const money = (n: number): string => `$${n.toLocaleString()}`;

const SPECIALIST_IDS = new Set<string>(
  SUBJECTS.filter((s) => s.specialist).map((s) => s.id),
);

/** A job is a "specialist" job when it only needs specialist subjects. */
function isSpecialistJob(job: Job): boolean {
  const ids = Object.keys(job.requiredSubjects);
  return ids.length > 0 && ids.every((id) => SPECIALIST_IDS.has(id));
}

const JOB_COLUMNS: Col[] = [
  { label: "Job", width: "34%" },
  { label: "Pay / shift", align: "right", width: "17%" },
  { label: "Study needed", width: "33%" },
  { label: "Experience", align: "right", width: "16%" },
];

const SECTIONS = [
  { id: "winning-jobs", label: "Winning jobs" },
  { id: "top-paying", label: "Top pay" },
  { id: "study", label: "Study" },
  { id: "specialist", label: "Specialist" },
  { id: "work", label: "Work" },
  { id: "money", label: "Money" },
  { id: "home", label: "Home" },
] as const;

export default function RulesPage() {
  const g = DEFAULT_GOALS;
  const winning = new Set<string>(g.winningJobs);

  const winningJobs = g.winningJobs
    .map((title) => findJob(title))
    .filter((j): j is Job => j !== undefined)
    .sort((a, b) => b.salary - a.salary);
  const specialistWinning = winningJobs.filter(isSpecialistJob);

  const topPaid = [...jobs].sort((a, b) => b.salary - a.salary).slice(0, 10);
  const starterJobs = jobs
    .filter((j) => Object.keys(j.requiredSubjects).length === 0)
    .sort((a, b) => a.expReq - b.expReq || a.salary - b.salary);

  const coreSubjects = SUBJECTS.filter((s) => !s.specialist);
  const specialistSubjects = SUBJECTS.filter((s) => s.specialist);

  /** One table row for a job. */
  const jobRow = (
    j: Job,
    opts: { win?: boolean; spec?: boolean; rank?: number } = {},
  ): TableRow => {
    const isWin = winning.has(j.title);
    return {
      key: j.title,
      highlight: isWin,
      cells: [
        <span key="t" className="flex flex-wrap items-center gap-2">
          {opts.rank !== undefined && (
            <span className="font-mono text-xs text-cyan-400/70">
              {String(opts.rank).padStart(2, "0")}
            </span>
          )}
          <span className="font-medium text-white">{j.title}</span>
          {opts.win && isWin && <Badge tone="win">★ Winning</Badge>}
          {opts.spec && isSpecialistJob(j) && (
            <Badge tone="spec">Specialist</Badge>
          )}
        </span>,
        <Pay key="p">{money(j.salary)}</Pay>,
        <Needs
          key="n"
          parts={Object.entries(j.requiredSubjects).map(([id, level]) => ({
            name: subjectName(id),
            level: level as number,
          }))}
        />,
        <Num key="e">{j.expReq}</Num>,
      ],
    };
  };

  /** Career ladder for one subject: every job that needs it, lowest pay first. */
  const ladderRows = (id: string): TableRow[] =>
    jobs
      .filter((j) => id in j.requiredSubjects)
      .sort((a, b) => a.salary - b.salary)
      .map((j) => jobRow(j, { win: true }));

  return (
    <RulesShell>
      {/* ── Hero + goals ─────────────────────────────────────────────── */}
      <Hero
        eyebrow="Rulebook"
        title="How to win"
        subtitle={
          <>
            Be the first to satisfy <strong>all</strong> of these at once:
          </>
        }
        nav={[...SECTIONS]}
      />

      <TileGrid>
        <Tile
          icon={<Banknote className="size-4" />}
          label="Cash"
          prefix="$"
          countTo={g.cash}
          hint="in your wallet"
        />
        <Tile
          icon={<Briefcase className="size-4" />}
          label="Winning job"
          value={`1 of ${g.winningJobs.length}`}
          hint="with the required subject levels"
        />
        <Tile
          icon={<Building2 className="size-4" />}
          label="Home"
          value="Luxury"
          hint={`apartment, rent ${money(apartmentTiers.luxury.rentAmount)}`}
        />
        <Tile
          icon={<HeartPulse className="size-4" />}
          label="Relationship"
          countTo={80}
          suffix="+"
          hint="relationship health"
        />
        <Tile
          icon={<Smile className="size-4" />}
          label="Happiness"
          countTo={g.happiness}
          suffix="+"
          hint="out of 100"
        />
        <Tile
          icon={<GraduationCap className="size-4" />}
          label="Education"
          countTo={g.education}
          suffix="+"
          hint="average subject level"
        />
      </TileGrid>

      {/* ── 01 Winning jobs ──────────────────────────────────────────── */}
      <Section id="winning-jobs" index={1} title="The winning jobs">
        <Body>
          <p>
            Only these jobs count towards a win. Each one is paid per shift and
            needs both the right subject levels and enough work experience.
          </p>
        </Body>
        <DataTable
          caption="Winning jobs"
          columns={JOB_COLUMNS}
          rows={winningJobs.map((j) => jobRow(j, { spec: true }))}
        />
        <Note>
          Whichever you pick, you still need an education average of{" "}
          <strong>{g.education}</strong>. That is the average of the four{" "}
          <em>core</em> subjects, so you will end up studying all four anyway.
          {specialistWinning.length > 0 && (
            <>
              {" "}
              The specialist winning jobs (
              {specialistWinning.map((j) => j.title).join(", ")}) are an
              alternative route: you also need to master their specialist
              subject on top of your core studies.
            </>
          )}
        </Note>
      </Section>

      {/* ── 02 Top paying jobs ───────────────────────────────────────── */}
      <Section id="top-paying" index={2} title="Top paying jobs">
        <Body>
          <p>
            The ten best salaries in the game. <strong>★ Winning</strong> marks
            a winning job. <em>Specialist</em> jobs need only specialist
            subjects.
          </p>
        </Body>
        <DataTable
          caption="Top ten paying jobs"
          columns={JOB_COLUMNS}
          rows={topPaid.map((j, i) =>
            jobRow(j, { win: true, spec: true, rank: i + 1 }),
          )}
        />
      </Section>

      {/* ── 03 Study ─────────────────────────────────────────────────── */}
      <Section id="study" index={3} title="What to study">
        <Body>
          <p>
            Study at the <strong>University</strong> or at home in your
            apartment. Each subject goes from 0 to 100, and a job unlocks the
            moment every subject it lists reaches the level shown. Pick a
            subject, then climb its ladder.
          </p>
          <p>
            <strong>Pay before you study.</strong> You register for a subject
            once by paying its tuition, and only then can you study it. The
            subject that leads to the best-paid job costs the most:{" "}
            {[...SUBJECTS]
              .sort((x, y) => subjectTuition(y.id) - subjectTuition(x.id))
              .map((x) => `${x.name} ${money(subjectTuition(x.id))}`)
              .join(", ")}
            .
          </p>
        </Body>
        <TileGrid cols={2}>
          <Tile
            icon={<BookOpen className="size-4" />}
            label="University"
            value="1 unit / hour"
            hint="choose 1–10 hours per session"
          />
          <Tile
            icon={<Clock className="size-4" />}
            label="At home"
            value={`${SHIFT_TIME} units`}
            hint="for 1 hour, so the University is more efficient"
          />
          <Tile
            icon={<TrendingUp className="size-4" />}
            label="Growth"
            value="Up to 2×"
            hint="roughly 2 points per hour, faster as a subject rises"
          />
        </TileGrid>

        <SubHead>Core subjects: these make up your education score</SubHead>
        <div className="space-y-4">
          {coreSubjects.map((s) => (
            <Block key={s.id} title={s.name} description={s.description}>
              <DataTable
                caption={`${s.name} career ladder`}
                columns={JOB_COLUMNS}
                rows={ladderRows(s.id)}
              />
            </Block>
          ))}
        </div>
      </Section>

      {/* ── 04 Specialist ────────────────────────────────────────────── */}
      <Section id="specialist" index={4} title="Specialist subjects">
        <Note>
          These unlock their own high-paying careers, but they are{" "}
          <strong>not</strong> counted in your education average, so studying
          them never raises your education score.
          {specialistWinning.length > 0 && (
            <>
              {" "}
              The top job of each (
              {specialistWinning.map((j) => j.title).join(", ")}) is a winning
              job, so any of them can win you the game. The other jobs are great
              for earning cash on the way.
            </>
          )}
        </Note>
        <div className="space-y-4">
          {specialistSubjects.map((s) => (
            <Block
              key={s.id}
              title={s.name}
              description={s.description}
              tag={<Badge tone="spec">Specialist</Badge>}
            >
              <DataTable
                caption={`${s.name} career ladder`}
                columns={JOB_COLUMNS}
                rows={ladderRows(s.id)}
              />
            </Block>
          ))}
        </div>
      </Section>

      {/* ── 05 Work ──────────────────────────────────────────────────── */}
      <Section id="work" index={5} title="Work and experience">
        <Bullets>
          <Bullet>
            A shift takes <strong>{SHIFT_TIME} time units</strong> and pays your
            job&apos;s salary. Each shift also earns{" "}
            <strong>+2 experience</strong>, up to a maximum of 100.
          </Bullet>
          <Bullet>
            &ldquo;Work the rest of the week&rdquo; spends all your remaining
            time and pays pro rata.
          </Bullet>
          <Bullet>
            To change jobs you need the experience <em>and</em> the subject
            levels. If you fall short, the game tells you exactly which subjects
            are missing.
          </Bullet>
          <Bullet>
            Experience is usually the slow part. The best jobs need 80–100,
            which takes dozens of shifts, so start working early.
          </Bullet>
        </Bullets>

        <SubHead>Starter jobs: no study needed</SubHead>
        <ChipList
          items={starterJobs.map((j) => ({
            label: j.title,
            sub: money(j.salary),
          }))}
        />
        <Body>
          <p>Take one of these first to start earning experience.</p>
        </Body>
      </Section>

      {/* ── 06 Turns & money ─────────────────────────────────────────── */}
      <Section id="money" index={6} title="Turns and money">
        <SubHead>Turns</SubHead>
        <Body>
          <p>
            Every week you get <strong>{WEEK_LENGTH} time units</strong>.
            Walking costs 5, most actions cost 5–30. When time runs out the week
            rolls over (a random event may strike, rent may fall due) and the
            next player takes over.
          </p>
        </Body>

        <SubHead>Money</SubHead>
        <Bullets>
          <Bullet>
            You start with <strong>{money(STARTING_CASH)}</strong>.
          </Bullet>
          <Bullet>
            Savings pay <strong>{Math.round(INTEREST_RATE * 100)}%</strong>{" "}
            interest, collectable once per week.
          </Bullet>
          <Bullet>Stock prices move once every full round of turns.</Bullet>
        </Bullets>
      </Section>

      {/* ── 07 Home & health ─────────────────────────────────────────── */}
      <Section id="home" index={7} title="Homes, rent and health">
        <DataTable
          caption="Apartment tiers"
          minWidth="22rem"
          columns={[
            { label: "Apartment", width: "50%" },
            { label: "Rent", align: "right", width: "25%" },
            { label: "Deposit", align: "right", width: "25%" },
          ]}
          rows={Object.entries(apartmentTiers).map(([tier, t]) => ({
            key: tier,
            highlight: tier === "luxury",
            cells: [
              <span key="a" className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">{t.label}</span>
                {tier === "luxury" && <Badge tone="goal">Goal</Badge>}
              </span>,
              <Pay key="r">{money(t.rentAmount)}</Pay>,
              <Num key="d">{money(t.deposit)}</Num>,
            ],
          }))}
        />
        <Bullets>
          <Bullet>
            Rent is due every <strong>{RENT_INTERVAL_WEEKS} weeks</strong>.
            Overdue rent garnishes <strong>20%</strong> of your wages until you
            pay.
          </Bullet>
          <Bullet>
            You need an apartment to sleep (which restores happiness and{" "}
            <strong>{SLEEP_ENERGY} energy</strong>) and to study at home.
          </Bullet>
          <Bullet>
            You can upgrade to a bigger apartment for a one-off fee.
          </Bullet>
          <Bullet>
            Remember to eat every week. If you forget, you get a doctor&apos;s
            bill of up to <strong>{money(DOCTOR_BILL)}</strong> and lose{" "}
            <strong>{DOCTOR_TIME_LOST} time units</strong> the following week,
            and your health drops by <strong>{MISSED_MEAL_HEALTH_LOSS}</strong>{" "}
            and your energy by <strong>{MISSED_MEAL_ENERGY_LOSS}</strong>.
          </Bullet>
          <Bullet>
            <strong>Meals are not all equal.</strong> Every meal counts as
            eating for the week, but pricier food restores more energy and
            happiness, and the first meal each week changes your health: junk
            food costs a little, quality food adds a lot. Extra meals in the
            same week only restore energy and happiness.
          </Bullet>
          <Bullet>
            <strong>Energy</strong> starts at 100. Each shift burns{" "}
            <strong>{WORK_ENERGY_COST}</strong> and studying burns more, while a
            new week gives back <strong>{WEEKLY_ENERGY_RECOVERY}</strong>. Below{" "}
            <strong>{TIRED_BELOW}</strong> you are tired (
            <strong>{Math.round((1 - TIRED_FACTOR) * 100)}%</strong> less pay
            and study gains); below <strong>{EXHAUSTED_BELOW}</strong> you are
            exhausted (
            <strong>{Math.round((1 - EXHAUSTED_FACTOR) * 100)}%</strong> less).
            Eat well or rest at home to recover.
          </Bullet>
          <Bullet>
            Your health must be <strong>{HEALTH_GOAL}+</strong> to win. Random
            events (illness, injury, burnout) can lower it at the end of any
            week. Healing services, dates and good meals raise it. Poor health
            never stops you from working.
          </Bullet>
        </Bullets>
      </Section>
    </RulesShell>
  );
}
