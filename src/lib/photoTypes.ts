export const photoTypeDefinitions = [
  { value: "front", label: "正面観", category: "standard", displayOrder: 1, selectable: true },
  { value: "right_buccal", label: "右側方面観", category: "standard", displayOrder: 2, selectable: true },
  { value: "left_buccal", label: "左側方面観", category: "standard", displayOrder: 3, selectable: true },
  { value: "upper_occlusal", label: "上顎咬合面観", category: "standard", displayOrder: 4, selectable: true },
  { value: "lower_occlusal", label: "下顎咬合面観", category: "standard", displayOrder: 5, selectable: true },
  { value: "upper_anterior", label: "上顎前歯部", category: "standard", displayOrder: 6, selectable: true },
  { value: "lower_anterior", label: "下顎前歯部", category: "standard", displayOrder: 7, selectable: true },
  { value: "upper_right_buccal", label: "上顎右側臼歯部", category: "standard", displayOrder: 8, selectable: true },
  { value: "upper_left_buccal", label: "上顎左側臼歯部", category: "standard", displayOrder: 9, selectable: true },
  { value: "lower_right_buccal", label: "下顎右側臼歯部", category: "standard", displayOrder: 10, selectable: true },
  { value: "lower_left_buccal", label: "下顎左側臼歯部", category: "standard", displayOrder: 11, selectable: true },
  { value: "right_posterior_occlusal", label: "右側臼歯部咬合面観", category: "standard", displayOrder: 12, selectable: true },
  { value: "left_posterior_occlusal", label: "左側臼歯部咬合面観", category: "standard", displayOrder: 13, selectable: true },
  { value: "anterior_occlusion", label: "前歯部咬合状態", category: "standard", displayOrder: 14, selectable: true },
  { value: "qr", label: "QR", category: "control", displayOrder: 15, selectable: true },
  { value: "other", label: "その他", category: "auxiliary", displayOrder: 16, selectable: true },
  { value: "unclassified", label: "未分類", category: "system", displayOrder: 17, selectable: true }
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
  ...fiveViewRequiredPhotoTypes,
  "upper_right_buccal",
  "upper_left_buccal",
  "lower_right_buccal",
  "lower_left_buccal"
];

export const fourteenViewRequiredPhotoTypes: PhotoTypeValue[] = [
  "front",
  "right_buccal",
  "left_buccal",
  "upper_occlusal",
  "lower_occlusal",
  "upper_anterior",
  "lower_anterior",
  "upper_right_buccal",
  "upper_left_buccal",
  "lower_right_buccal",
  "lower_left_buccal",
  "right_posterior_occlusal",
  "left_posterior_occlusal",
  "anterior_occlusion"
];

const auxiliarySelectablePhotoTypes: PhotoTypeValue[] = ["qr", "other", "unclassified"];

export const fiveViewSelectablePhotoTypes: PhotoTypeValue[] = [...fiveViewRequiredPhotoTypes, ...auxiliarySelectablePhotoTypes];
export const nineViewSelectablePhotoTypes: PhotoTypeValue[] = [...nineViewRequiredPhotoTypes, ...auxiliarySelectablePhotoTypes];
export const fourteenViewSelectablePhotoTypes: PhotoTypeValue[] = [...fourteenViewRequiredPhotoTypes, ...auxiliarySelectablePhotoTypes];
export const allStandardSelectablePhotoTypes: PhotoTypeValue[] = fourteenViewSelectablePhotoTypes;

export type PhotoProtocolValue = "five_view" | "nine_view" | "fourteen_view" | "partial" | "other";

export type PhotoProtocolDefinition = {
  value: PhotoProtocolValue;
  label: string;
  requiredPhotoTypes: PhotoTypeValue[];
  selectablePhotoTypes: PhotoTypeValue[];
};

export const photoProtocolDefinitions: PhotoProtocolDefinition[] = [
  {
    value: "five_view",
    label: "5枚法",
    requiredPhotoTypes: fiveViewRequiredPhotoTypes,
    selectablePhotoTypes: fiveViewSelectablePhotoTypes
  },
  {
    value: "nine_view",
    label: "9枚法",
    requiredPhotoTypes: nineViewRequiredPhotoTypes,
    selectablePhotoTypes: nineViewSelectablePhotoTypes
  },
  {
    value: "fourteen_view",
    label: "14枚法",
    requiredPhotoTypes: fourteenViewRequiredPhotoTypes,
    selectablePhotoTypes: fourteenViewSelectablePhotoTypes
  },
  {
    value: "partial",
    label: "部分撮影",
    requiredPhotoTypes: [],
    selectablePhotoTypes: allStandardSelectablePhotoTypes
  },
  {
    value: "other",
    label: "その他",
    requiredPhotoTypes: [],
    selectablePhotoTypes: allStandardSelectablePhotoTypes
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
  return getRequiredPhotoTypes(protocol);
}

export function isPhotoProtocolValue(value: string | null | undefined): value is PhotoProtocolValue {
  return photoProtocolDefinitions.some((definition) => definition.value === value);
}

export function getPhotoProtocolLabel(value: string | null | undefined) {
  return getPhotoProtocolDefinition(value).label;
}

export function getPhotoProtocolDefinition(value: string | null | undefined) {
  const normalized = isPhotoProtocolValue(value) ? value : defaultPhotoProtocol.value;
  return photoProtocolDefinitions.find((definition) => definition.value === normalized) ?? defaultPhotoProtocol;
}

export function getRequiredPhotoTypes(value: string | null | undefined) {
  return getPhotoProtocolDefinition(value).requiredPhotoTypes;
}

export function getSelectablePhotoTypeOptionsForProtocol(
  protocolValue: string | null | undefined,
  currentPhotoType?: string | null
) {
  const selectableValues = [...getPhotoProtocolDefinition(protocolValue).selectablePhotoTypes];

  if (isPhotoTypeValue(currentPhotoType) && !selectableValues.includes(currentPhotoType)) {
    selectableValues.push(currentPhotoType);
  }

  return selectableValues
    .slice()
    .sort((a, b) => getPhotoTypeOrder(a) - getPhotoTypeOrder(b))
    .map((value) => ({
      value,
      label: getPhotoTypeLabel(value)
    }));
}
