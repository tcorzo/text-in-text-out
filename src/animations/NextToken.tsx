// Remotion scene: the model adds one token at a time to the text so far.
// Colors come from Starlight's CSS variables, so the scene follows the light and dark themes.
import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { END, type NextTokenProps } from './next-token-steps';

/** Frames per token: the candidates grow in, the winner lights up, then it moves to the text. */
export const FRAMES_PER_STEP = 24;
/** Frames the finished answer stays on screen before the loop restarts. */
export const HOLD_FRAMES = 75;
export const durationFor = (steps: number) => steps * FRAMES_PER_STEP + HOLD_FRAMES;

const color = {
	text: 'var(--sl-color-white)',
	muted: 'var(--sl-color-gray-3)',
	track: 'var(--sl-color-gray-6)',
	accent: 'var(--sl-color-accent)',
	accentText: 'var(--sl-color-accent-high)',
	bg: 'var(--sl-color-bg-sidebar)',
	line: 'var(--sl-color-hairline)',
};
const mono = 'var(--sl-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const label: CSSProperties = {
	fontSize: 20,
	letterSpacing: 1,
	textTransform: 'uppercase',
	color: color.muted,
	marginBottom: 8,
};

/** Shows a token's leading space as a visible dot, so " API" and "API" look different. */
const show = (t: string) => (t === END ? t : t.replace(/^ /, '·'));

export const NextToken = ({ prompt, steps }: NextTokenProps) => {
	const frame = useCurrentFrame();
	// A narrow composition wraps the text onto more lines, so it needs more room and less padding.
	const narrow = useVideoConfig().width < 800;
	const index = Math.min(Math.floor(frame / FRAMES_PER_STEP), steps.length - 1);
	const local = frame - index * FRAMES_PER_STEP;
	const finished = frame >= steps.length * FRAMES_PER_STEP;

	const grow = interpolate(local, [0, 9], [0, 1], clamp);
	const pick = interpolate(local, [10, 14], [0, 1], clamp);
	const added = finished || local >= 18;

	const done = steps.slice(0, added ? index + 1 : index).map((s) => s.candidates[0].text);
	const reply = done.filter((t) => t !== END);
	const newest = added && !finished ? done.length - 1 : -1;
	const { candidates } = steps[index];

	return (
		<AbsoluteFill style={{ background: color.bg, color: color.text, fontFamily: mono, padding: narrow ? 24 : 40 }}>
			<div style={{ fontSize: 26, lineHeight: 1.5, minHeight: narrow ? 195 : 120 }}>
				<span style={{ color: color.muted }}>user: {prompt}</span>
				<br />
				<span style={{ color: color.muted }}>assistant: </span>
				{reply.map((t, i) => (
					<span key={i} style={{ color: i === newest ? color.accentText : color.text }}>
						{t}
					</span>
				))}
			</div>

			<div style={{ borderTop: `2px solid ${color.line}`, margin: '16px 0 20px' }} />

			{finished ? (
				<div style={{ fontSize: 30, lineHeight: 1.6 }}>
					<div style={{ color: color.muted }}>The model predicted {END}, so the answer is over.</div>
					<div>
						stop_reason: <span style={{ color: color.accentText }}>"end_turn"</span>
					</div>
				</div>
			) : (
				<>
					<div style={label}>
						Next token · step {index + 1} of {steps.length}
					</div>
					{candidates.map((c, i) => {
						const winner = i === 0;
						const lit = winner ? pick : 0;
						return (
							<div key={c.text} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 10 }}>
								<div
									style={{
										width: 220,
										fontSize: 26,
										textAlign: 'right',
										color: lit > 0.5 ? color.accentText : color.text,
										opacity: winner ? 1 : 1 - 0.5 * pick,
									}}
								>
									{show(c.text)}
								</div>
								<div style={{ flex: 1, height: 24, background: color.track, borderRadius: 6 }}>
									<div
										style={{
											width: `${c.p * grow * 100}%`,
											height: '100%',
											borderRadius: 6,
											background: winner ? color.accent : color.muted,
											opacity: winner ? 0.55 + 0.45 * lit : 0.5,
										}}
									/>
								</div>
								<div style={{ width: 80, fontSize: 24, color: color.muted }}>{Math.round(c.p * grow * 100)}%</div>
							</div>
						);
					})}
				</>
			)}
		</AbsoluteFill>
	);
};
