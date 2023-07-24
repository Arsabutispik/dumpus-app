"use client";

import { colors } from "#root/tailwind.config";
import * as resvg from "@resvg/resvg-wasm";
import { useCallback, useState } from "react";
import { useMount } from "react-use";
import satori, { Font, init as initSatori } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import StaticShareImage, {
  type Props as StaticShareImageProps,
} from "~/components/StaticShareImage";

async function getFontData(weight: number) {
  return await fetch(
    `https://cdn.jsdelivr.net/npm/@fontsource/rubik/files/rubik-latin-${weight}-normal.woff`
  ).then((res) => res.arrayBuffer());
}

let _init = false;

export default function useGenerateImg() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "initialized" | "error"
  >("idle");
  const width = 1200;
  const height = 775;

  async function init() {
    if (status !== "idle") return;
    if (_init) {
      setStatus("initialized");
      return;
    }
    setStatus("loading");

    try {
      const yoga = await initYoga(
        await fetch("/wasm/yoga.wasm").then((res) => res.arrayBuffer())
      );
      initSatori(yoga);
      await resvg.initWasm(fetch("/wasm/resvg.wasm"));
      setStatus("initialized");
    } catch (err) {
      setStatus("error");
    }
    _init = true;
  }

  useMount(async () => await init());

  const generate = useCallback(async function (props: StaticShareImageProps) {
    const fonts = (await Promise.all(
      [400, 500, 600, 700].map(async (weight) => ({
        name: "Rubik Latin",
        data: await getFontData(weight),
        weight,
        style: "normal",
      }))
    )) as Font[];

    try {
      const svg = await satori(<StaticShareImage {...props} />, {
        width,
        height,
        fonts,
        tailwindConfig: {
          theme: {
            colors,
          },
        },
      });

      const resvgJS = new resvg.Resvg(svg, {
        fitTo: {
          mode: "width",
          value: width,
        },
        dpi: 2,
        shapeRendering: 2,
        textRendering: 2,
        imageRendering: 1,
      });
      const pngBuffer = resvgJS.render().asPng();

      const webFile = new File([pngBuffer], "image.png", {
        type: "image/png",
      });
      const imageData = btoa(String.fromCharCode(...new Uint8Array(pngBuffer)));
      const url = URL.createObjectURL(
        new Blob([pngBuffer], { type: "image/png" })
      );

      return { webFile, imageData, url };
    } catch (err) {
      throw new Error("Error calling satori", { cause: err });
    }
  }, []);

  return {
    init,
    generate,
    status,
    width,
    height,
  };
}
