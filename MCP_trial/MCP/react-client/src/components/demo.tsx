import { LiquidButton } from "@/components/ui/liquid-glass-button";

/**
 * UI showcase: liquid-glass control on top of the global WebGL shader background.
 */
export default function DemoOne() {
  return (
    <div className="relative flex min-h-[min(520px,70vh)] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="text-center space-y-2 max-w-md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          Shader backdrop
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white/95">
          Liquid glass
        </h2>
        <p className="text-sm text-white/55 leading-relaxed">
          The animated background is drawn with WebGL; frosted panels and the
          button use backdrop blur so you see the motion through the glass.
        </p>
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-90"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 42%, rgba(168,85,247,0.08) 100%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-4">
          <LiquidButton className="z-10 text-lg shadow-lg text-white/95">
            Try the effect
          </LiquidButton>
          <span className="text-xs text-white/40">
            Drag the window — the shader fills the viewport
          </span>
        </div>
      </div>
    </div>
  );
}
