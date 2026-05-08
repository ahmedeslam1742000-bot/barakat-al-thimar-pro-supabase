import { useMemo } from 'react';

/**
 * useAnimationConfig
 * ─────────────────────────────────────────────────────
 * يعيد تكوين الأنيميشن بشكل ذكي بناءً على عدد العناصر.
 * إذا كان عدد العناصر أقل من 50 → تفعيل layout animation كاملة
 * إذا تجاوز 50 عنصراً → الاكتفاء بـ opacity فقط لحماية المعالج
 *
 * الاستخدام:
 *   const { shouldAnimate, animationProps } = useAnimationConfig(items.length);
 *   <motion.div {...animationProps} layout={shouldAnimate}>
 */
export function useAnimationConfig(itemCount = 0) {
  return useMemo(() => {
    const shouldAnimate = itemCount < 50;

    const animationProps = shouldAnimate
      ? {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -8 },
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
          layout: true,
        }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.12 },
          layout: false,
        };

    return { shouldAnimate, animationProps };
  }, [itemCount]);
}
