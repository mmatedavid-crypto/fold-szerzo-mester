import type { LandContext, YesNoUnknown } from "@/lib/rank/leaseTypes";

export interface LandContextValue extends LandContext {
  commonOwnershipUI: YesNoUnknown;
  coOwnerLeaseUI: YesNoUnknown;
  wineUI: YesNoUnknown;
  mixedParcelUI: YesNoUnknown;
  bundledLeaseUI: YesNoUnknown;
}

const yesNo = (v: YesNoUnknown) => v === "yes";

export function toLandContext(v: LandContextValue): LandContext {
  return {
    transaction: v.transaction,
    branch: v.branch,
    cultivationBranch: v.cultivationBranch,
    commonOwnership: yesNo(v.commonOwnershipUI),
    coOwnerLeaseToThirdParty: yesNo(v.coOwnerLeaseUI),
    wineGeoIndication: yesNo(v.wineUI),
    mixedParcel: yesNo(v.mixedParcelUI),
    largerArea: v.largerArea,
    bundledLease: yesNo(v.bundledLeaseUI),
    exceptions: v.exceptions,
  };
}

export const DEFAULT_LAND: LandContextValue = {
  transaction: "lease",
  branch: "non_forest",
  cultivationBranch: undefined,
  commonOwnershipUI: "unknown",
  coOwnerLeaseUI: "unknown",
  wineUI: "unknown",
  mixedParcelUI: "no",
  bundledLeaseUI: "no",
  largerArea: "unknown",
  commonOwnership: false,
  coOwnerLeaseToThirdParty: false,
  wineGeoIndication: false,
  mixedParcel: false,
  bundledLease: false,
  exceptions: [],
};
