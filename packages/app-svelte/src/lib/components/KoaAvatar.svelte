<script lang="ts">
	/**
	 * KOA Avatar - Exact port from KoAAvatar2.tsx
	 * SVG-based mechanical eye with 15 mood states
	 */

	// --- TYPES ---
	export type KoaMood =
		| 'NEUTRAL'
		| 'SUSPICIOUS'
		| 'DISAPPOINTED'
		| 'AMUSED'
		| 'WATCHING'
		| 'PROCESSING'
		| 'GLITCH'
		| 'SLEEPY'
		| 'ANGRY'
		| 'ACCEPTING'
		| 'CURIOUS'
		| 'GRUDGING'
		| 'IMPRESSED'
		| 'RESIGNED'
		| 'SMUG';

	export interface KoaSkin {
		id: string;
		name: string;
		bodyFill: string;
		bodyStroke: string;
		faceplateFill: string;
		faceplateStroke: string;
		texture?: 'none' | 'grid' | 'lines' | 'dots' | 'carbon' | 'spikes' | 'technical';
		borderStyle?: 'simple' | 'thick' | 'double' | 'dashed' | 'offset' | 'tech' | 'glow' | 'serrated';
		lensColor?: string;  // Optional override for iris/ring color (otherwise uses mood color)
		pupilColor?: string; // Optional override for pupil color (otherwise uses mood color)
	}

	export interface AvatarExpression {
		lidTop: number;
		lidBottom: number;
		lidAngle: number;
		pupilScale: number;
		lidCurveTop?: number;
		lidCurveBottom?: number;
	}

	// --- CONSTANTS ---
	export const PRIME_SKIN: KoaSkin = {
		id: 'prime',
		name: 'Prime Edition',
		bodyFill: '#0f172a',
		bodyStroke: '#334155',
		faceplateFill: '#000000',
		faceplateStroke: '#1e293b',
		texture: 'none',
		borderStyle: 'tech'
	};

	export const DURIAN_SKIN: KoaSkin = {
		id: 'durian',
		name: 'King Durian',
		bodyFill: '#65a30d',
		bodyStroke: '#365314',
		faceplateFill: '#fef08a',
		faceplateStroke: '#ca8a04',
		texture: 'spikes',
		borderStyle: 'serrated'
	};

	export const BUBBLEGUM_SKIN: KoaSkin = {
		id: 'pop',
		name: 'Bubblegum',
		bodyFill: '#f472b6',
		bodyStroke: '#be185d',
		faceplateFill: '#4a044e',
		faceplateStroke: '#831843',
		texture: 'dots',
		borderStyle: 'offset'
	};

	const MOOD_EXPRESSIONS: Record<string, AvatarExpression> = {
		NEUTRAL: { lidTop: -2, lidBottom: -2, lidAngle: 0, pupilScale: 1.0, lidCurveTop: 12, lidCurveBottom: 12 },
		WATCHING: { lidTop: -5, lidBottom: -5, lidAngle: 0, pupilScale: 1.3, lidCurveTop: 14, lidCurveBottom: 14 },
		SUSPICIOUS: { lidTop: 40, lidBottom: 35, lidAngle: 0, pupilScale: 0.6, lidCurveTop: 2, lidCurveBottom: 2 },
		DISAPPOINTED: { lidTop: 55, lidBottom: 0, lidAngle: 0, pupilScale: 0.8, lidCurveTop: 8, lidCurveBottom: 10 },
		AMUSED: { lidTop: 5, lidBottom: 40, lidAngle: 0, pupilScale: 1.1, lidCurveTop: 25, lidCurveBottom: -25 },
		SLEEPY: { lidTop: 45, lidBottom: 45, lidAngle: 0, pupilScale: 0.5, lidCurveTop: 12, lidCurveBottom: 12 },
		ANGRY: { lidTop: 25, lidBottom: 25, lidAngle: 15, pupilScale: 1.0, lidCurveTop: -5, lidCurveBottom: 5 },
		GLITCH: { lidTop: 10, lidBottom: 10, lidAngle: -5, pupilScale: 0.8, lidCurveTop: 10, lidCurveBottom: 10 },
		PROCESSING: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupilScale: 1.0, lidCurveTop: 12, lidCurveBottom: 12 },
		ACCEPTING: { lidTop: 0, lidBottom: 15, lidAngle: 0, pupilScale: 1.2, lidCurveTop: 16, lidCurveBottom: 16 },
		CURIOUS: { lidTop: -8, lidBottom: -5, lidAngle: 2, pupilScale: 1.15, lidCurveTop: 15, lidCurveBottom: 15 },
		GRUDGING: { lidTop: 20, lidBottom: 10, lidAngle: 0, pupilScale: 0.9, lidCurveTop: 5, lidCurveBottom: 5 },
		IMPRESSED: { lidTop: -5, lidBottom: 20, lidAngle: 0, pupilScale: 1.25, lidCurveTop: 20, lidCurveBottom: -15 },
		RESIGNED: { lidTop: 45, lidBottom: 10, lidAngle: -2, pupilScale: 0.85, lidCurveTop: 10, lidCurveBottom: 10 },
		SMUG: { lidTop: 15, lidBottom: 35, lidAngle: -8, pupilScale: 1.0, lidCurveTop: 5, lidCurveBottom: -20 }
	};

	const MOOD_COLORS: Record<string, { main: string; pupil: string }> = {
		NEUTRAL: { main: '#E07A5F', pupil: '#FFFFFF' },
		WATCHING: { main: '#3b82f6', pupil: '#FFFFFF' },
		SUSPICIOUS: { main: '#f59e0b', pupil: '#FFFFFF' },
		DISAPPOINTED: { main: '#64748b', pupil: '#FFFFFF' },
		AMUSED: { main: '#10b981', pupil: '#FFFFFF' },
		SLEEPY: { main: '#6366f1', pupil: '#FFFFFF' },
		ANGRY: { main: '#ef4444', pupil: '#FFFFFF' },
		GLITCH: { main: '#d946ef', pupil: '#FFFFFF' },
		PROCESSING: { main: '#8b5cf6', pupil: '#FFFFFF' },
		ACCEPTING: { main: '#14b8a6', pupil: '#FFFFFF' },
		CURIOUS: { main: '#E07A5F', pupil: '#FFFFFF' },
		GRUDGING: { main: '#E07A5F', pupil: '#FFFFFF' },
		IMPRESSED: { main: '#fbbf24', pupil: '#FFFFFF' },
		RESIGNED: { main: '#94a3b8', pupil: '#FFFFFF' },
		SMUG: { main: '#E07A5F', pupil: '#FFFFFF' }
	};

	// --- PROPS ---
	interface Props {
		mood?: KoaMood | string;
		skin?: KoaSkin;
		expressionOverride?: Partial<AvatarExpression>;
		isSpeaking?: boolean;
		width?: string;
		height?: string;
		class?: string;
	}

	let {
		mood = 'NEUTRAL',
		skin = BUBBLEGUM_SKIN,
		expressionOverride,
		isSpeaking = false,
		width = '100%',
		height = '100%',
		class: className = ''
	}: Props = $props();

	// --- STATE ---
	let isBlinking = $state(false);
	let irisRotation = $state(0);
	let innerRingRotation = $state(0);
	let idleSpinDuration = $state(40 + Math.random() * 20);
	let idleSpinDirection = $state<'normal' | 'reverse'>(Math.random() > 0.5 ? 'normal' : 'reverse');
	let uid = $state(Math.random().toString(36).substring(2, 9));

	// --- EFFECTS ---
	// Blink loop
	$effect(() => {
		if (mood === 'SLEEPY' || mood === 'GLITCH' || mood === 'PROCESSING') return;
		let timeout: ReturnType<typeof setTimeout>;
		const scheduleBlink = () => {
			const nextBlinkTime = Math.random() * 4000 + 2000;
			timeout = setTimeout(() => {
				isBlinking = true;
				setTimeout(() => (isBlinking = false), 150);
				scheduleBlink();
			}, nextBlinkTime);
		};
		scheduleBlink();
		return () => clearTimeout(timeout);
	});

	// Iris rotation
	$effect(() => {
		if (mood === 'GLITCH' || mood === 'PROCESSING') return;
		let timeout: ReturnType<typeof setTimeout>;
		const scheduleRotation = () => {
			const nextTime = Math.random() * 4000 + 1500;
			timeout = setTimeout(() => {
				const spin = [-180, -90, -45, 45, 90, 180][Math.floor(Math.random() * 6)];
				irisRotation = irisRotation + spin;
				scheduleRotation();
			}, nextTime);
		};
		scheduleRotation();
		return () => clearTimeout(timeout);
	});

	// Inner ring rotation
	$effect(() => {
		if (mood === 'GLITCH' || mood === 'PROCESSING') return;
		let timeout: ReturnType<typeof setTimeout>;
		const scheduleInnerRotation = () => {
			const nextTime = Math.random() * 3000 + 1000;
			timeout = setTimeout(() => {
				const spin = [-90, -45, 45, 90][Math.floor(Math.random() * 4)];
				innerRingRotation = innerRingRotation + spin;
				scheduleInnerRotation();
			}, nextTime);
		};
		scheduleInnerRotation();
		return () => clearTimeout(timeout);
	});

	// --- DERIVED ---
	let defaultExp = $derived(MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.NEUTRAL);
	let exp = $derived<AvatarExpression>({
		lidTop: expressionOverride?.lidTop ?? defaultExp.lidTop,
		lidBottom: expressionOverride?.lidBottom ?? defaultExp.lidBottom,
		lidAngle: expressionOverride?.lidAngle ?? defaultExp.lidAngle,
		pupilScale: expressionOverride?.pupilScale ?? defaultExp.pupilScale,
		lidCurveTop: expressionOverride?.lidCurveTop ?? defaultExp.lidCurveTop ?? 12,
		lidCurveBottom: expressionOverride?.lidCurveBottom ?? defaultExp.lidCurveBottom ?? 12
	});

	let moodColors = $derived(MOOD_COLORS[mood] || MOOD_COLORS.NEUTRAL);
	let colors = $derived({
		main: skin.lensColor || moodColors.main,
		pupil: skin.pupilColor || moodColors.pupil
	});
	let isProcessing = $derived(mood === 'PROCESSING');
	let isGlitch = $derived(mood === 'GLITCH');
	let isLaughing = $derived(mood === 'AMUSED');
	let isScanning = $derived(isProcessing || mood === 'SUSPICIOUS');
	let borderStyle = $derived(skin.borderStyle || 'simple');

	// --- GEOMETRY ---
	const LENS_RADIUS = 21.5;
	const LID_RADIUS = 31;
	const LENS_CENTER_X = 100;
	const LENS_CENTER_Y = 50;
	const RING_RADIUS = 23;
	const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
	const RING_WEIGHTS = [4, 2, 2, 7];
	const RING_GAP_PX = 10;
	const totalWeight = RING_WEIGHTS.reduce((sum, w) => sum + w, 0);
	const availableDashSpace = RING_CIRCUMFERENCE - RING_WEIGHTS.length * RING_GAP_PX;
	const weightUnit = availableDashSpace / totalWeight;
	const ringDashArray = RING_WEIGHTS.map((w) => `${w * weightUnit} ${RING_GAP_PX}`).join(' ');

	const mapLidPos = (p: number) => (p / 100) * (LID_RADIUS * 2) - LID_RADIUS;
	const CURVE_SCALE = 0.5;
	const BUFFER = LID_RADIUS + 10;

	// Lid calculations with gap dampening
	let lidData = $derived.by(() => {
		const rawTop = isBlinking ? 50 : exp.lidTop;
		const rawBottom = isBlinking ? 50 : exp.lidBottom;

		let lidY_Top = mapLidPos(rawTop);
		let lidY_Bottom = LID_RADIUS - (rawBottom / 100) * (LID_RADIUS * 2);

		let cTop = (exp.lidCurveTop ?? 12) * CURVE_SCALE;
		let cBot = (exp.lidCurveBottom ?? 12) * CURVE_SCALE;

		const gap = lidY_Bottom - lidY_Top;
		if (gap <= 0) {
			const mid = (lidY_Top + lidY_Bottom) / 2;
			lidY_Top = mid;
			lidY_Bottom = mid;
			cTop = 0;
			cBot = 0;
		} else if (gap < 10) {
			const dampener = gap / 10;
			cTop *= dampener;
			cBot *= dampener;
		}

		return { lidY_Top, lidY_Bottom, cTop, cBot };
	});

	let topLidPath = $derived(
		`M ${-BUFFER} ${-BUFFER} L ${BUFFER} ${-BUFFER} L ${BUFFER} ${lidData.lidY_Top + lidData.cTop} Q 0 ${lidData.lidY_Top - lidData.cTop} ${-BUFFER} ${lidData.lidY_Top + lidData.cTop} Z`
	);
	let bottomLidPath = $derived(
		`M ${-BUFFER} ${BUFFER} L ${BUFFER} ${BUFFER} L ${BUFFER} ${lidData.lidY_Bottom - lidData.cBot} Q 0 ${lidData.lidY_Bottom + lidData.cBot} ${-BUFFER} ${lidData.lidY_Bottom - lidData.cBot} Z`
	);

	const bodyPath = `M 100 8 C 132 8 142 18 142 50 C 142 82 132 92 100 92 C 68 92 58 82 58 50 C 58 18 68 8 100 8 Z`;
	const screenPath = `M 100 18 C 124 18 132 26 132 50 C 132 74 124 82 100 82 C 76 82 68 74 68 50 C 68 26 76 18 100 18 Z`;
	const techPath = `M 70 4 L 54 4 L 54 24 M 130 4 L 146 4 L 146 24 M 146 76 L 146 96 L 130 96 M 70 96 L 54 96 L 54 76`;

	// Texture
	let textureOpacity = $derived(skin.id === 'melon' ? 0.5 : (skin.texture === 'grid' || skin.texture === 'spikes' || skin.texture === 'technical' ? 0.3 : 0.15));
	let textureFill = $derived(skin.id === 'blueprint' || skin.id === 'neon' ? '#ffffff' : '#000000');
	let hasTexture = $derived(skin.texture && skin.texture !== 'none');

	// --- TRANSITION STYLES ---
	const TRANSITION_BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)';
	let lidDuration = $derived(isBlinking ? '0.1s' : '0.3s');
	const colorDuration = '0.3s';

	let transitionStyle = $derived(`transition: all ${colorDuration} ${TRANSITION_BEZIER}`);
	let pathTransitionStyle = $derived(`transition: d ${lidDuration} ${TRANSITION_BEZIER}, fill ${colorDuration} ${TRANSITION_BEZIER}, stroke ${colorDuration} ${TRANSITION_BEZIER}`);
	let transformTransitionStyle = $derived(`transition: transform ${colorDuration} ${TRANSITION_BEZIER}`);
</script>

<div
	class="relative flex items-center justify-center {className}"
	style="width: {width}; height: {height};"
>
	<style>
		@keyframes koa-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
		@keyframes koa-shadow { 0%, 100% { transform: scaleX(1); opacity: 0.3; } 50% { transform: scaleX(0.85); opacity: 0.2; } }
		@keyframes koa-chuckle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
		@keyframes koa-spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
		@keyframes koa-pulse-talk { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
		@keyframes koa-scan { 0% { opacity: 0; transform: translateY(-10px); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(10px); } }
		@keyframes koa-autofocus {
			0% { transform: scale(1); opacity: 0.8; }
			1% { transform: scale(0.85); opacity: 1; }
			2% { transform: scale(1.08); opacity: 0.8; }
			3% { transform: scale(0.96); opacity: 1; }
			4% { transform: scale(1); opacity: 0.8; }
			100% { transform: scale(1); opacity: 0.8; }
		}
		@keyframes koa-breathe { 0%, 100% { transform: scale(0.92); } 50% { transform: scale(1.05); } }
		@keyframes koa-glitch { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
		@keyframes koa-zzz { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
		@keyframes koa-pulse-opacity { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
	</style>

	<svg viewBox="10 0 180 100" style="width: 100%; height: 100%; overflow: visible;">
		<defs>
			<!-- Filters -->
			<filter id="koa-glow-soft-{uid}" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="coloredBlur" />
				<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
			</filter>
			<filter id="koa-glow-strong-{uid}" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="6" result="coloredBlur" />
				<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
			</filter>
			<filter id="koa-border-glow-{uid}" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="coloredBlur" />
				<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
			</filter>

			<!-- Clip Paths -->
			<clipPath id="koa-lens-clip-{uid}"><circle cx="0" cy="0" r={LENS_RADIUS} /></clipPath>
			<clipPath id="koa-lid-clip-{uid}"><circle cx="0" cy="0" r={LID_RADIUS} /></clipPath>

			<!-- Patterns -->
			<pattern id="koa-pattern-grid-{uid}" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
				<path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5" />
			</pattern>
			<pattern id="koa-pattern-lines-{uid}" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<rect x="0" y="0" width="2" height="4" fill="currentColor" />
			</pattern>
			<pattern id="koa-pattern-dots-{uid}" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
				<circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
			</pattern>
			<pattern id="koa-pattern-carbon-{uid}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<rect x="0" y="0" width="4" height="4" fill="currentColor" />
				<rect x="4" y="4" width="4" height="4" fill="currentColor" />
			</pattern>
			<pattern id="koa-pattern-spikes-{uid}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
				<path d="M 4 0.5 L 7.5 7.5 L 0.5 7.5 Z" fill="currentColor" />
			</pattern>
			<pattern id="koa-pattern-technical-{uid}" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
				<path d="M 0 6 L 12 6 M 6 0 L 6 12" fill="none" stroke="currentColor" stroke-width="0.3" />
				<circle cx="6" cy="6" r="1" fill="currentColor" />
			</pattern>
		</defs>

		<!-- Shadow (stays grounded, scales with float) -->
		<ellipse cx="100" cy="96" rx="40" ry="4" fill="black" filter="url(#koa-glow-soft-{uid})" style="animation: koa-shadow 6s ease-in-out infinite; transform-origin: 100px 96px;" />

		<!-- Floating body group -->
		<g style="animation: koa-float 6s ease-in-out infinite{isLaughing ? ', koa-chuckle 0.4s ease-in-out infinite' : ''}; transform-origin: 100px 50px;">
			<!-- BODY -->
			{#if borderStyle === 'double'}
				<g style={transitionStyle}>
					<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="8" style={transitionStyle} />
					<path d={bodyPath} fill="none" stroke={skin.bodyFill} stroke-width="4" style={transitionStyle} />
					<path d={bodyPath} fill="none" stroke={skin.bodyStroke} stroke-width="1" style={transitionStyle} />
				</g>
			{:else if borderStyle === 'dashed'}
				<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="3" stroke-dasharray="10 6" stroke-linecap="round" style={transitionStyle} />
			{:else if borderStyle === 'thick'}
				<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="8" style={transitionStyle} />
			{:else if borderStyle === 'offset'}
				<g style={transitionStyle}>
					<path d={bodyPath} fill={skin.bodyStroke} stroke="none" transform="translate(6, 6)" opacity="0.4" style={transitionStyle} />
					<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="3" style={transitionStyle} />
				</g>
			{:else if borderStyle === 'tech'}
				<g style={transitionStyle}>
					<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="1.5" stroke-opacity="0.8" style={transitionStyle} />
					<path d={techPath} fill="none" stroke={skin.bodyStroke} stroke-width="2.5" stroke-linecap="square" style={transitionStyle} />
				</g>
			{:else if borderStyle === 'glow'}
				<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="3" filter="url(#koa-border-glow-{uid})" style={transitionStyle} />
			{:else if borderStyle === 'serrated'}
				<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="3" stroke-dasharray="3 3" stroke-linejoin="miter" style={transitionStyle} />
			{:else}
				<path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} stroke-width="4" style={transitionStyle} />
			{/if}

			<!-- BODY TEXTURE -->
			{#if hasTexture}
				<path
					d={bodyPath}
					fill="url(#koa-pattern-{skin.texture}-{uid})"
					opacity={textureOpacity * 0.7}
					style="color: {textureFill}; pointer-events: none; transition: opacity {colorDuration} ease, color {colorDuration} ease;"
				/>
			{/if}

			<!-- FACEPLATE -->
			<path d={screenPath} fill={skin.faceplateFill} stroke={skin.faceplateStroke} stroke-width="1.5" style={transitionStyle} />

			<!-- TEXTURE -->
			{#if hasTexture}
				<path
					d={screenPath}
					fill="url(#koa-pattern-{skin.texture}-{uid})"
					opacity={textureOpacity}
					style="color: {textureFill}; pointer-events: none; transition: opacity {colorDuration} ease, color {colorDuration} ease;"
				/>
			{/if}

			<!-- LENS -->
			<g transform="translate({LENS_CENTER_X}, {LENS_CENTER_Y})">
				<g clip-path="url(#koa-lens-clip-{uid})">
					<rect x={-LENS_RADIUS} y={-LENS_RADIUS} width={LENS_RADIUS * 2} height={LENS_RADIUS * 2} fill="#000" />
					<circle cx="0" cy="0" r={LENS_RADIUS} fill={colors.main} opacity="0.2" style={transitionStyle} />

					<!-- PUPIL & IRIS -->
					{#if isProcessing}
						<g>
							<circle cx="0" cy="0" r="16" fill="none" stroke={colors.main} stroke-width="2.5" stroke-dasharray="12 18" stroke-linecap="round" style="{transitionStyle}; animation: koa-spin-slow 1.5s linear infinite;" />
							<g transform="scale({exp.pupilScale})" style={transformTransitionStyle}>
								<rect x="-5" y="-5" width="10" height="10" fill={colors.pupil} filter="url(#koa-glow-soft-{uid})" style="{transitionStyle}; animation: koa-spin-slow 1s linear infinite, koa-pulse-opacity 0.8s infinite;" />
							</g>
						</g>
					{:else}
						<g>
							<!-- INNER RING with AUTOFOCUS -->
							<g style="transform: rotate({innerRingRotation}deg); transition: transform 1.5s {TRANSITION_BEZIER};">
								<circle cx="0" cy="0" r="12" fill="none" stroke={colors.main} stroke-width="1.2" stroke-dasharray="3.14 3.14" stroke-linecap="round" style="{transitionStyle}; animation: koa-autofocus 8s linear infinite;" />
							</g>
							<g style="animation: {!isGlitch ? 'koa-breathe 4s ease-in-out infinite' : 'none'};">
								<g transform="scale({exp.pupilScale})" style={transformTransitionStyle}>
									{#if mood === 'ANGRY'}
										<rect x="-8" y="-8" width="16" height="16" fill={colors.pupil} transform="rotate(45)" filter="url(#koa-glow-strong-{uid})" style="{transitionStyle}; animation: {isSpeaking ? 'koa-pulse-talk 0.2s ease-in-out infinite' : 'none'};" />
									{:else if isGlitch}
										<rect x="-8" y="-8" width="16" height="16" fill={colors.pupil} filter="url(#koa-glow-soft-{uid})" style="{transitionStyle}; animation: koa-glitch 0.1s infinite;" />
									{:else}
										<circle cx="0" cy="0" r="7" fill={colors.pupil} filter="url(#koa-glow-soft-{uid})" style="{transitionStyle}; animation: {isSpeaking ? 'koa-pulse-talk 0.2s ease-in-out infinite' : 'none'};" />
									{/if}
								</g>
							</g>
						</g>
					{/if}

					{#if isScanning}
						<rect x={-LENS_RADIUS} y="-2" width={LENS_RADIUS * 2} height="4" fill={colors.main} opacity="0.6" filter="url(#koa-glow-soft-{uid})" style="{transitionStyle}; animation: koa-scan 2s linear infinite;" />
					{/if}
				</g>

				<!-- RING -->
				<g style="transform: rotate({irisRotation}deg); transition: transform 1.2s {TRANSITION_BEZIER};">
					<g style="animation: koa-spin-slow {idleSpinDuration}s linear infinite; transform-origin: 0 0; animation-direction: {idleSpinDirection};">
						<circle
							cx="0" cy="0" r={RING_RADIUS}
							fill="none"
							stroke={colors.main}
							stroke-width="2.6"
							stroke-opacity="0.5"
							stroke-dasharray={ringDashArray}
							stroke-linecap="round"
							filter={mood === 'ANGRY' || mood === 'SUSPICIOUS' ? `url(#koa-glow-strong-${uid})` : ''}
							style={transitionStyle}
						/>
					</g>
				</g>

				<!-- LIDS -->
				<g clip-path="url(#koa-lid-clip-{uid})" transform="rotate({exp.lidAngle})" style={transformTransitionStyle}>
					<path d={topLidPath} fill={skin.faceplateFill} style={pathTransitionStyle} />
					<path d={bottomLidPath} fill={skin.faceplateFill} style={pathTransitionStyle} />
					{#if hasTexture}
						<path d={topLidPath} fill="url(#koa-pattern-{skin.texture}-{uid})" opacity={textureOpacity} style="color: {textureFill}; pointer-events: none; transition: d {lidDuration} {TRANSITION_BEZIER}, opacity {colorDuration} ease;" />
						<path d={bottomLidPath} fill="url(#koa-pattern-{skin.texture}-{uid})" opacity={textureOpacity} style="color: {textureFill}; pointer-events: none; transition: d {lidDuration} {TRANSITION_BEZIER}, opacity {colorDuration} ease;" />
					{/if}
					<path d={topLidPath} fill="none" stroke={colors.main} stroke-width="1" stroke-opacity="0.6" clip-path="url(#koa-lid-clip-{uid})" style={pathTransitionStyle} />
					<path d={bottomLidPath} fill="none" stroke={colors.main} stroke-width="1" stroke-opacity="0.6" clip-path="url(#koa-lid-clip-{uid})" style={pathTransitionStyle} />
				</g>

				{#if mood === 'SLEEPY'}
					<g fill={colors.main} style={transitionStyle}>
						<text x="5" y="-10" font-size="12" font-family="monospace" style="animation: koa-zzz 2s infinite;">Z</text>
						<text x="15" y="-18" font-size="10" font-family="monospace" style="animation: koa-zzz 2s infinite 0.5s;">z</text>
					</g>
				{/if}
			</g>
		</g>
	</svg>
</div>
