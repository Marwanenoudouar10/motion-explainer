// Remotion CLI defaults for every render (scripts/*.sh add scale, concurrency and nice).
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setConcurrency(4); // keep the machine usable; scripts pass their own value too
