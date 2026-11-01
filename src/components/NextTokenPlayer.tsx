// The next-token animation as an island: <NextTokenPlayer client:visible /> in MDX.
// It autoplays once visible, except for readers who ask the system for reduced motion.
import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { NextToken, durationFor } from '~/animations/NextToken';
import { nextTokenData } from '~/animations/next-token-steps';

// Narrow screens get a narrower composition with the same font sizes, so the text wraps
// onto more lines instead of shrinking past readable.
const WIDE = { width: 960, height: 450 };
const NARROW = { width: 600, height: 470 };

export default function NextTokenPlayer() {
	const ref = useRef<PlayerRef>(null);
	const [size, setSize] = useState(WIDE);

	useEffect(() => {
		if (window.matchMedia('(max-width: 40em)').matches) setSize(NARROW);
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) ref.current?.play();
	}, []);

	// The Player renders nothing on the server. This box does, so client:visible has something
	// to watch and the page doesn't jump when the Player mounts. `not-content` keeps Starlight's
	// Markdown spacing out of the scene.
	return (
		<div className="not-content" style={{ aspectRatio: `${size.width} / ${size.height}`, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sl-color-hairline)' }}>
			<Player
				ref={ref}
				component={NextToken}
				inputProps={nextTokenData}
				durationInFrames={durationFor(nextTokenData.steps.length)}
				fps={30}
				compositionWidth={size.width}
				compositionHeight={size.height}
				style={{ width: '100%', height: '100%' }}
				numberOfSharedAudioTags={0}
				controls
				loop
				clickToPlay
			/>
		</div>
	);
}
