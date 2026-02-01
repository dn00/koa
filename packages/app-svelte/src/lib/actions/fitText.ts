/**
 * Svelte action that auto-sizes text to fit within its container.
 * Shrinks font size until content fits without overflow.
 */
export function fitText(
    node: HTMLElement,
    options: { text: string | any[]; minSize?: number; maxSize?: number; multiLine?: boolean; refitToken?: number }
) {
    let { minSize = 12, maxSize = 18, multiLine = true, refitToken = 0 } = options;

    function fit() {
        // Reset to max size first
        node.style.fontSize = `${maxSize}px`;
        node.style.lineHeight = '1.4';

        // Get container dimensions
        const containerHeight = node.clientHeight;
        const containerWidth = node.clientWidth;

        // If container has no size yet, retry later
        if (containerHeight === 0 || containerWidth === 0) {
            requestAnimationFrame(fit);
            return;
        }

        // Binary search for the right size (faster than linear)
        let lo = minSize;
        let hi = maxSize;

        while (hi - lo > 0.5) {
            const mid = (lo + hi) / 2;
            node.style.fontSize = `${mid}px`;

            const overflowsHeight = node.scrollHeight > containerHeight + 1; // +1 for rounding
            const overflowsWidth = !multiLine && node.scrollWidth > containerWidth + 1;

            if (overflowsHeight || overflowsWidth) {
                hi = mid;
            } else {
                lo = mid;
            }
        }

        // Use the largest size that fits
        node.style.fontSize = `${lo}px`;
    }

    // Observe size changes
    const observer = new ResizeObserver(() => {
        requestAnimationFrame(fit);
    });
    observer.observe(node);

    // Initial fit after a frame (let layout settle)
    requestAnimationFrame(fit);

    return {
        update(newOptions: { text: string | any[]; minSize?: number; maxSize?: number; multiLine?: boolean; refitToken?: number }) {
            if (newOptions.minSize !== undefined) minSize = newOptions.minSize;
            if (newOptions.maxSize !== undefined) maxSize = newOptions.maxSize;
            if (newOptions.multiLine !== undefined) multiLine = newOptions.multiLine;
            if (newOptions.refitToken !== undefined) refitToken = newOptions.refitToken;
            requestAnimationFrame(fit);
        },
        destroy() {
            observer.disconnect();
        }
    };
}
