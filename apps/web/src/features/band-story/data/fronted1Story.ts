import rawStoryData from "../../../../../../frontend-design/fronted1-workbench/fronted1.cleaned.json";
import { normalizeBandStoryData } from "../lib/normalizeBandStoryData";

export const fronted1Story = normalizeBandStoryData(rawStoryData);
