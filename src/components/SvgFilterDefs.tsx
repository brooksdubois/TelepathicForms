import type { Component } from 'solid-js';

const hiddenSvgStyle = {
  position: 'absolute',
  width: '0',
  height: '0',
  overflow: 'hidden',
  'pointer-events': 'none',
} as const;

const SvgFilterDefs: Component = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width="0"
    height="0"
    style={hiddenSvgStyle}
  >
    <defs>
      <filter
        id="tf-tube-warp-soft"
        x="-8%"
        y="-8%"
        width="116%"
        height="116%"
        color-interpolation-filters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.010 0.050"
          numOctaves="1"
          seed="5"
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            values="0.010 0.050;0.0105 0.052;0.010 0.050"
            dur="6s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
        >
          <animate
            attributeName="scale"
            values="4;6;4"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>

      <filter
        id="tf-tube-warp-hard"
        x="-12%"
        y="-12%"
        width="124%"
        height="124%"
        color-interpolation-filters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.060"
          numOctaves="2"
          seed="7"
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            values="0.012 0.060;0.0128 0.063;0.012 0.060"
            dur="5.5s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="8"
          xChannelSelector="R"
          yChannelSelector="G"
        >
          <animate
            attributeName="scale"
            values="8;12;8"
            dur="1.1s"
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>
    </defs>
  </svg>
);

export default SvgFilterDefs;
