import core             from "./en/core";
import collectibles     from "./en/collectibles";
import arrowheads       from "./en/arrowheads";
import bottles          from "./en/bottles";
import coins            from "./en/coins";
import tarot            from "./en/tarot";
import eggs             from "./en/eggs";
import flowers          from "./en/flowers";
import fossils          from "./en/fossils";
import heirlooms        from "./en/heirlooms";
import jewelry          from "./en/jewelry";
import settings         from "./en/settings";
import pins             from "./en/pins";
import treasures        from "./en/treasures";
import weekly           from "./en/weekly";

const en = {
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

export default en;
