// Data for the next-token animation in what-is-a-model.mdx.
// The reply is the one from the chapter's "Calling it" example. The probabilities are made up
// for illustration: the Claude API doesn't return them.

export type Candidate = { text: string; p: number };
export type Step = { candidates: Candidate[] };
export type NextTokenProps = { prompt: string; steps: Step[] };

/** The token that marks the end of the answer. */
export const END = '(end)';

const step = (...pairs: Array<[string, number]>): Step => ({
	candidates: pairs.map(([text, p]) => ({ text, p })),
});

// In every step the first candidate is the most likely one, and it's the one added to the text.
export const nextTokenData: NextTokenProps = {
	prompt: 'Explain what an API is in one sentence.',
	steps: [
		step(['An', 0.62], ['API', 0.21], ['In', 0.09]),
		step([' API', 0.97], [' application', 0.02], [' interface', 0.01]),
		step([' is', 0.93], [' (', 0.05], [' defines', 0.02]),
		step([' a', 0.88], [' the', 0.07], [' how', 0.03]),
		step([' set', 0.71], [' way', 0.16], [' contract', 0.08]),
		step([' of', 0.99], [' that', 0.01]),
		step([' rules', 0.82], [' definitions', 0.09], [' functions', 0.05]),
		step([' that', 0.78], [' and', 0.11], [' for', 0.08]),
		step([' lets', 0.57], [' allows', 0.31], [' defines', 0.07]),
		step([' one', 0.64], [' different', 0.18], [' software', 0.12]),
		step([' program', 0.74], [' piece', 0.14], [' application', 0.09]),
		step([' ask', 0.44], [' request', 0.29], [' talk', 0.17]),
		step([' another', 0.91], [' a', 0.06]),
		step([' program', 0.88], [' for', 0.06]),
		step([' for', 0.83], [' to', 0.14]),
		step([' data', 0.79], [' information', 0.17]),
		step([' or', 0.86], [' and', 0.12]),
		step([' actions', 0.41], [' services', 0.33], [' to', 0.12]),
		step(['.', 0.96], [',', 0.03]),
		step([END, 0.98], [' For', 0.01]),
	],
};
