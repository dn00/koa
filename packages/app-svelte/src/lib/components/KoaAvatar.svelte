<script lang="ts">
	import { spring } from 'svelte/motion';

	/**
	 * KOA Avatar - Ported from mockup-brutalist/KoaAvatarPortable.tsx
	 * SVG-based mechanical eye with 15 mood states
	 */

	// Mood enum
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

	interface Props {
		mood?: KoaMood;
		isSpeaking?: boolean;
		width?: string;
		height?: string;
	}

	let { mood = 'NEUTRAL', isSpeaking = false, width = '100%', height = '100%' }: Props = $props();

	// Expression config per mood
	const MOOD_EXPRESSIONS: Record<
		string,
		{
			lidTop: number;
			lidBottom: number;
			lidAngle: number;
			pupilScale: number;
			lidCurveTop: number;
			lidCurveBottom: number;
		}
	> = {
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

	// Skin config
	const SKIN = {
		bodyFill: '#F9FAFB',
		bodyStroke: '#2D3142',
		faceplateFill: '#2D3142',
		faceplateStroke: '#E07A5F',
		texture: 'technical'
	};

	// State
	let isBlinking = $state(false);
	let irisRotation = $state(0);
	let innerRingRotation = $state(0);
	let idleSpinDuration = $state(40 + Math.random() * 20);
	let idleSpinDirection = $state(Math.random() > 0.5 ? 'normal' : 'reverse');
	
	// Boing scale spring
	const scaleSpring = spring(1, { stiffness: 0.1, damping: 0.4 });

	function handleBoing() {
		scaleSpring.set(0.9);
		setTimeout(() => scaleSpring.set(1), 150);
	}

	// Unique ID for SVG defs
	let uid = $state(Math.random().toString(36).substring(2, 9));

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

	// Derived values
	let exp = $derived(MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.NEUTRAL);
	let colors = $derived(MOOD_COLORS[mood] || MOOD_COLORS.NEUTRAL);
	let isProcessing = $derived(mood === 'PROCESSING');
	let isGlitch = $derived(mood === 'GLITCH');
	let isLaughing = $derived(mood === 'AMUSED');
	let isScanning = $derived(isProcessing || mood === 'SUSPICIOUS');
	let activeColor = $derived(colors.main);
	let pupilColor = $derived('#FFFFFF');

	// Geometry
	const LENS_RADIUS = 21.5;
	const LID_RADIUS = 31;
	const LENS_CENTER_X = 100;
	const LENS_CENTER_Y = 52;
	const RING_RADIUS = 23;
	const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
	const RING_WEIGHTS = [4, 2, 2, 7];
	const RING_GAP_PX = 10;
	const totalWeight = RING_WEIGHTS.reduce((sum, w) => sum + w, 0);
	const availableDashSpace = RING_CIRCUMFERENCE - RING_WEIGHTS.length * RING_GAP_PX;
	const weightUnit = availableDashSpace / totalWeight;
	const ringDashArray = RING_WEIGHTS.map((w) => `${w * weightUnit} ${RING_GAP_PX}`).join(' ');

	const mapLidPos = (p: number) => (p / 100) * (LID_RADIUS * 2) - LID_RADIUS;

	let lidY_Top = $derived.by(() => {
		const rawTop = isBlinking ? 50 : exp.lidTop;
		return mapLidPos(rawTop);
	});

	let lidY_Bottom = $derived.by(() => {
		const rawBottom = isBlinking ? 50 : exp.lidBottom;
		return LID_RADIUS - (rawBottom / 100) * (LID_RADIUS * 2);
	});

	const CURVE_SCALE = 0.5;
	let cTop = $derived((exp.lidCurveTop ?? 12) * CURVE_SCALE);
	let cBot = $derived((exp.lidCurveBottom ?? 12) * CURVE_SCALE);

	const BUFFER = LID_RADIUS + 10;

	let topLidPath = $derived(
		`M ${-BUFFER} ${-BUFFER} L ${BUFFER} ${-BUFFER} L ${BUFFER} ${lidY_Top + cTop} Q 0 ${lidY_Top - cTop} ${-BUFFER} ${lidY_Top + cTop} Z`
	);
	let bottomLidPath = $derived(
		`M ${-BUFFER} ${BUFFER} L ${BUFFER} ${BUFFER} L ${BUFFER} ${lidY_Bottom - cBot} Q 0 ${lidY_Bottom + cBot} ${-BUFFER} ${lidY_Bottom - cBot} Z`
	);

	const bodyPath = `M 100 4 C 128 4 148 22 148 50 C 148 84 137 96 100 96 C 63 96 52 84 52 50 C 52 22 72 4 100 4 Z`;
	const screenPath = `M 100 17 C 127 17 135 25 135 52 C 135 79 127 87 100 87 C 73 87 65 79 65 52 C 65 25 73 17 100 17 Z`;
</script>



<!-- Outer Container -->
<button 
	class="relative flex items-center justify-center outline-none cursor-pointer group"
	style="width: {width}; height: {height};"
	onclick={handleBoing}
	aria-label="Koa Avatar"
>
	<!-- Floating Wrapper -->
	<div class="w-full h-full animate-float will-change-transform" style="transform: scale({$scaleSpring})">
		<!-- Main Container -->
		<div 
			class="w-full h-full flex items-center justify-center" 
		>
			<svg viewBox="0 0 200 100" class="w-full h-full overflow-visible" style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15));">
				<defs>
					<clipPath id="koa-lens-clip-{uid}"><circle cx="0" cy="0" r={LENS_RADIUS} /></clipPath>
					<clipPath id="koa-lid-clip-{uid}"><circle cx="0" cy="0" r={LID_RADIUS} /></clipPath>
					<pattern id="koa-pattern-technical-{uid}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
						<path d="M 2 0 L 0 0 L 0 2" fill="none" stroke="currentColor" stroke-width="1" />
						<path d="M 18 0 L 20 0 L 20 2" fill="none" stroke="currentColor" stroke-width="1" />
						<path d="M 0 18 L 0 20 L 2 20" fill="none" stroke="currentColor" stroke-width="1" />
						<path d="M 18 20 L 20 20 L 20 18" fill="none" stroke="currentColor" stroke-width="1" />
						<rect x="9.5" y="9.5" width="1" height="1" fill="currentColor" />
					</pattern>
				</defs>

				<g class={isLaughing ? 'animate-chuckle' : ''}>
			<!-- Body -->
			<path d={bodyPath} fill={SKIN.bodyFill} stroke={SKIN.bodyStroke} stroke-width="2" class="transition-all duration-300" />

			<!-- Texture -->
			<path d={bodyPath} fill="url(#koa-pattern-technical-{uid})" opacity="0.6" class="pointer-events-none" />

			<!-- Faceplate -->
			<path d={screenPath} fill={SKIN.faceplateFill} stroke={SKIN.faceplateStroke} stroke-width="3" class="transition-all duration-300" />

			<!-- Lens -->
			<g transform="translate({LENS_CENTER_X}, {LENS_CENTER_Y})">
				<g clip-path="url(#koa-lens-clip-{uid})">
					<rect x={-LENS_RADIUS} y={-LENS_RADIUS} width={LENS_RADIUS * 2} height={LENS_RADIUS * 2} fill={SKIN.faceplateFill} />

					<!-- Eyes Container (Fixed relative to body) -->
					<g>

					<!-- Iris tint -->
					<circle cx="0" cy="0" r={LENS_RADIUS} fill={activeColor} opacity="0.3" class="transition-all duration-300" />

					<!-- Pupil & Iris -->
					{#if isProcessing}
						<g>
							<circle cx="0" cy="0" r="16" fill="none" stroke={activeColor} stroke-width="2.5" stroke-dasharray="12 18" stroke-linecap="round" class="animate-spin-slow transition-all duration-300" />
							<g transform="scale({exp.pupilScale})" class="transition-transform duration-300">
								<rect x="-5" y="-5" width="10" height="10" fill={pupilColor} class="animate-spin-fast animate-pulse-opacity" />
							</g>
						</g>
					{:else}
						<g>
							<!-- Inner Ring -->
							<g style="transform: rotate({innerRingRotation}deg);" class="transition-transform duration-1000">
								<circle cx="0" cy="0" r="12" fill="none" stroke={activeColor} stroke-width="1.2" stroke-dasharray="3.14 3.14" stroke-linecap="round" class="animate-autofocus transition-all duration-300" />
							</g>
							<g class={!isGlitch ? 'animate-breathe' : ''}>
								<g transform="scale({exp.pupilScale})" class="transition-transform duration-300">
									{#if mood === 'ANGRY'}
										<rect x="-8" y="-8" width="16" height="16" fill={pupilColor} transform="rotate(45)" class={isSpeaking ? 'animate-pulse-talk' : ''} />
									{:else if isGlitch}
										<rect x="-8" y="-8" width="16" height="16" fill={pupilColor} class="animate-glitch-shake" />
									{:else}
										<circle cx="0" cy="0" r="7" fill={pupilColor} class={isSpeaking ? 'animate-pulse-talk' : ''} />
									{/if}
								</g>
							</g>
						</g>
					{/if}
					</g><!-- End Eyes Container -->

					{#if isScanning}
						<rect x={-LENS_RADIUS} y="-2" width={LENS_RADIUS * 2} height="4" fill={activeColor} opacity="0.6" class="animate-scan transition-all duration-300" />
					{/if}
				</g>

				<!-- Ring -->
				<g style="transform: rotate({irisRotation}deg);" class="transition-transform duration-1000">
					<g class="animate-idle-spin" style="animation-duration: {idleSpinDuration}s; animation-direction: {idleSpinDirection};">
						<circle cx="0" cy="0" r={RING_RADIUS} fill="none" stroke={activeColor} stroke-width="2.6" stroke-opacity="1" stroke-dasharray={ringDashArray} stroke-linecap="square" class="transition-all duration-300" />
					</g>
				</g>

				<!-- Lids -->
				<g clip-path="url(#koa-lid-clip-{uid})" transform="rotate({exp.lidAngle})" class="transition-transform duration-300">
					<path d={topLidPath} fill={SKIN.faceplateFill} class="transition-all duration-150" />
					<path d={bottomLidPath} fill={SKIN.faceplateFill} class="transition-all duration-150" />
					<path d={topLidPath} fill="url(#koa-pattern-technical-{uid})" opacity="0.6" class="pointer-events-none" />
					<path d={bottomLidPath} fill="url(#koa-pattern-technical-{uid})" opacity="0.6" class="pointer-events-none" />
					<path d={topLidPath} fill="none" stroke={activeColor} stroke-width="1" stroke-opacity="0.6" clip-path="url(#koa-lid-clip-{uid})" />
					<path d={bottomLidPath} fill="none" stroke={activeColor} stroke-width="1" stroke-opacity="0.6" clip-path="url(#koa-lid-clip-{uid})" />
				</g>

				{#if mood === 'SLEEPY'}
					<g fill={activeColor}>
						<text x="5" y="-10" font-size="12" font-family="monospace" class="animate-zzz">Z</text>
						<text x="15" y="-18" font-size="10" font-family="monospace" class="animate-zzz-delay">z</text>
					</g>
				{/if}
			</g>
		</g>
			</svg>
		</div>
	</div>
</button>

<style>
	@keyframes chuckle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-3px); }
	}
	.animate-chuckle { animation: chuckle 0.4s ease-in-out infinite; }

	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}
	.animate-float { animation: float 6s ease-in-out infinite; }

	@keyframes idle-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	.animate-idle-spin { animation: idle-spin 40s linear infinite; transform-origin: 0 0; }

	@keyframes spin-slow {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	.animate-spin-slow { animation: spin-slow 1.5s linear infinite; }

	@keyframes spin-fast {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	.animate-spin-fast { animation: spin-fast 1s linear infinite; }

	@keyframes pulse-opacity {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1; }
	}
	.animate-pulse-opacity { animation: pulse-opacity 0.8s infinite; }

	@keyframes pulse-talk {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}
	.animate-pulse-talk { animation: pulse-talk 0.2s ease-in-out infinite; }

	@keyframes scan {
		0% { opacity: 0; transform: translateY(-10px); }
		50% { opacity: 1; }
		100% { opacity: 0; transform: translateY(10px); }
	}
	.animate-scan { animation: scan 2s linear infinite; }

	@keyframes autofocus {
		0% { transform: scale(1); opacity: 0.8; }
		1% { transform: scale(0.85); opacity: 1; }
		2% { transform: scale(1.08); opacity: 0.8; }
		3% { transform: scale(0.96); opacity: 1; }
		4% { transform: scale(1); opacity: 0.8; }
		100% { transform: scale(1); opacity: 0.8; }
	}
	.animate-autofocus { animation: autofocus 8s linear infinite; }

	@keyframes breathe {
		0%, 100% { transform: scale(0.92); }
		50% { transform: scale(1.05); }
	}
	.animate-breathe { animation: breathe 4s ease-in-out infinite; }

	@keyframes glitch-shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-1px); }
		75% { transform: translateX(1px); }
	}
	.animate-glitch-shake { animation: glitch-shake 0.1s infinite; }

	@keyframes zzz {
		0%, 100% { opacity: 0; }
		50% { opacity: 1; }
	}
	.animate-zzz { animation: zzz 2s infinite; }
	.animate-zzz-delay { animation: zzz 2s infinite 0.5s; }
</style>
