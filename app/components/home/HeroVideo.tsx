"use client";

import { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

// Background clip for the home hero, with a pause button (any looping video
// longer than 5s needs one). Phones set to "reduce motion" get the still frame.
export default function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    // The video's own pause event updates the button.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ref.current?.pause();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover object-[50%_62%]"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-hidden
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause background video" : "Play background video"}
        className="absolute bottom-5 right-5 z-20 grid h-11 w-11 place-content-center rounded-full bg-black/45 text-white/85 backdrop-blur hover:bg-black/70 transition-colors"
      >
        {playing ? <FaPause /> : <FaPlay className="translate-x-[1px]" />}
      </button>
    </>
  );
}
