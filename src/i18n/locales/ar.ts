import core from "./ar/core";
import collectibles from "./ar/collectibles";
import arrowheads from "./ar/arrowheads";
import bottles from "./ar/bottles";
import coins from "./ar/coins";
import tarot from "./ar/tarot";
import eggs from "./ar/eggs";
import flowers from "./ar/flowers";
import fossils from "./ar/fossils";
import heirlooms from "./ar/heirlooms";
import jewelry from "./ar/jewelry";
import settings from "./ar/settings";
import pins from "./ar/pins";
import treasures from "./ar/treasures";
import weekly from "./ar/weekly";

const ar = {
    ...core,
    ...collectibles,
    ...arrowheads,
    ...bottles,
    ...coins,
    ...tarot,
    ...eggs,
    ...flowers,
    ...fossils,
    ...heirlooms,
    ...jewelry,
    ...settings,
    ...pins,
    ...treasures,
    ...weekly,
} as const;

export default ar;
