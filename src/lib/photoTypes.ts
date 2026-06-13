export const photoTypeDefinitions = [
  { value: "unclassified", label: "未分類", category: "system", displayOrder: 7, selectable: true },
  { value: "qr", label: "QR", category: "control", displayOrder: 0, selectable: true },
  { value: "front", label: "正面観", category: "standard", displayOrder: 1, selectable: true },
  { value: "right_buccal", label: "右側方面観", category: "standard", displayOrder: 2, selectable: true },
  { value: "left_buccal", label: "左側方面観", category: "standard", displayOrder: 3, selectable: true },
  { value: "upper_occlusal", label: "上顎咬合面観", category: "standard", displayOrder: 4, selectable: true },
  { value: "lower_occlusal", label: "下顎咬合面観", category: "standard", displayOrder: 5, selectable: true },
  { value: "other", label: "その他", category: "auxiliary", displayOrder: 6, selectable: true }
] as const;

export type PhotoTypeValue = (typeof photoTypeDefinitions)[number]["value"];
export type PhotoTypeCategory = (typeof photoTypeDefinitions)[number]["category"];

export const photoTypeOptions = photoTypeDefinitions
  .filter((definition) => definition.selectable)
  .map(({ value, label }) => ({ value, label }));

export const photoTypeDisplayOrder = photoTypeDefinitions
  .slice()
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map((definition) => definition.value);

export const fiveViewRequiredPhotoTypes: PhotoTypeValue[] = [
  "front",
  "right_buccal",
  "left_buccal",
  "upper_occlusal",
  "lower_occlusal"
];

export const nineViewRequiredPhotoTypes: PhotoTypeValue[] = [
  ...fiveViewRequiredPhotoTypes
  // TODO: Add the additional four 9-view labels after the clinic protocol names are finalized.
];

export type PhotoProtocolValue = "five_view" | "nine_view" | "fourteen_view" | "partial" | "other";

export type PhotoProtocolDefinition = {
  value: PhotoProtocolValue;
  label: string;
  requiredPhotoTypes: PhotoTypeValue[];
};

export const photoProtocolDefinitions: PhotoProtocolDefinition[] = [
  {
    value: "five_view",
    label: "5枚法",
    requiredPhotoTypes: fiveViewRequiredPhotoTypes
  },
  {
    value: "nine_view",
    label: "9枚法",
    requiredPhotoTypes: nineViewRequiredPhotoTypes
  },
  {
    value: "fourteen_view",
    label: "14枚法",
    requiredPhotoTypes: []
    // TODO: Define required photo types after the 14-view protocol is finalized.
  },
  {
    value: "partial",
    label: "部分撮影",
    requiredPhotoTypes: []
  },
  {
    value: "other",
    label: "その他",
    requiredPhotoTypes: []
  }
];

export const defaultPhotoProtocol = photoProtocolDefinitions[0];

export function isPhotoTypeValue(value: string | null | undefined): value is PhotoTypeValue {
  return photoTypeDefinitions.some((definition) => definition.value === value);
}

export function getPhotoTypeLabel(value: string | null | undefined) {
  const normalized = isPhotoTypeValue(value) ? value : "unclassified";
  return photoTypeDefinitions.find((definition) => definition.value === normalized)?.label ?? "未分類";
}

export function getPhotoTypeOrder(value: string | null | undefined) {
  const normalized = isPhotoTypeValue(value) ? value : "unclassified";
  return photoTypeDefinitions.find((definition) => definition.value === normalized)?.displayOrder ?? Number.MAX_SAFE_INTEGER;
}

export function getRequiredPhotoTypesForProtocol(protocol: PhotoProtocolValue = "five_view") {
  return photoProtocolDefinitions.find((definition) => definition.value === protocol)?.requiredPhotoTypes ?? fiveViewRequiredPhotoTypes;
}

export function isPhotoProtocolValue(value: string | null | undefined): value is PhotoProtocolValue {
  return photoProtocolDefinitions.some((definition) => definition.value === value);
}

export function getPhotoProtocolLabel(value: string | null | undefined) {
  const normalized = isPhotoProtocolValue(value) ? value : defaultPhotoProtocol.value;
  return photoProtocolDefinitions.find((definition) => definition.value === normalized)?.label ?? defaultPhotoProtocol.label;
}
