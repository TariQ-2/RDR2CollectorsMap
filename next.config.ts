import type { NextConfig } from "next";

const REPO_NAME = "RDR2CollectorsMap";
function buildId(): string {
    if (process.env.NEXT_PUBLIC_BUILD_ID) {
        return process.env.NEXT_PUBLIC_BUILD_ID;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    const yearFirst = String(year)[0];
    const yearLast = String(year).slice(-1);

    return `v1.0:${yearFirst}${day}${month}${yearLast}-${hour}${minute}`;
}

const nextConfig: NextConfig = {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },

    basePath: `/${REPO_NAME}`,
    assetPrefix: `/${REPO_NAME}/`,

    reactCompiler: true,
    env: {
        NEXT_PUBLIC_BUILD_ID: buildId(),
    },
};

export default nextConfig;
