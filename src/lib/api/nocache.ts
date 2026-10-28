export const getNocacheParam = (): string => process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';
