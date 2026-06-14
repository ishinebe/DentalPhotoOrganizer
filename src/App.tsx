import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  FolderDown,
  Gauge,
  HardDriveDownload,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wifi,
  WifiOff
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDashboardPhotoStats, type DashboardStatsResult } from "./lib/photoStats";
import {
  defaultPhotoProtocol,
  getPhotoProtocolDefinition,
  getPhotoProtocolLabel,
  getPhotoTypeLabel,
  getPhotoTypeOrder,
  isPhotoProtocolValue,
  isPhotoTypeValue,
  photoProtocolDefinitions,
  photoTypeOptions,
  type PhotoTypeValue
} from "./lib/photoTypes";
import {
  fetchReadyExportGroups,
  markGroupsExported,
  type ExportGroup,
  type ExportGroupPhoto,
  type MarkExportedGroup
} from "./lib/exportGroups";
import { importPhotoMetadata, type ImportPhotosResult, type LocalImageFile } from "./lib/importPhotos";
import {
  searchPatientPhotoGroups,
  type SearchGroupFilters,
  type SearchGroupPhoto,
  type SearchGroupResult
} from "./lib/searchGroups";
import {
  completeReviewGroup,
  fetchReviewGroupsByStatus,
  fetchReviewGroupPhotos,
  mergeGroups,
  movePhotoToGroup,
  regroupPendingPhotosByQrBoundaries,
  returnReviewGroupToPending,
  splitPhotoToNewGroup,
  type ReviewGroup,
  type ReviewGroupForm,
  type ReviewGroupListStatus,
  type ReviewGroupPhoto,
  type PhotoTypeUpdate,
  updateReviewGroupMetadata
} from "./lib/reviewGroups";
import { fetchStaffMembers, type StaffMember } from "./lib/staff";
import { getSupabaseConnectionStatus } from "./lib/supabase";

type View = "dashboard" | "import" | "review" | "export" | "search" | "settings";
type ImportStatus = "未選択" | "フォルダ選択済み" | "対象ファイルなし" | "取込中" | "取込完了" | "取込失敗" | "Supabase未設定";
type SupabaseStatus = "checking" | "success" | "failed" | "not-configured";
type ReviewLoadStatus = "読み込み中" | "データなし" | "取得失敗" | "表示中" | "Supabase未設定";
type ReviewActionStatus =
  | "待機中"
  | "一時保存中"
  | "一時保存成功"
  | "一時保存失敗"
  | "確認完了中"
  | "確認完了成功"
  | "確認完了失敗"
  | "差し戻し中"
  | "差し戻し成功"
  | "差し戻し失敗"
  | "移動中"
  | "移動成功"
  | "移動失敗"
  | "分離中"
  | "分離成功"
  | "分離失敗"
  | "統合中"
  | "統合成功"
  | "統合失敗"
  | "分け直し中"
  | "分け直し成功"
  | "分け直し失敗";
type PreviewStatus = "未選択" | "読み込み中" | "表示中" | "読み込み失敗" | "未対応形式" | "Electron API未接続";
type ExportLoadStatus = "読み込み中" | "表示中" | "データなし" | "取得失敗" | "Supabase未設定";
type ExportActionStatus = "待機中" | "フォルダ選択中" | "書き出し中" | "書き出し完了" | "書き出し失敗";

const emptyStats = {
  totalPhotos: 0,
  pendingReviews: 0,
  importedToday: 0,
  approvedPhotos: 0
};

const navItems: Array<{ id: View; label: string; icon: typeof Gauge }> = [
  { id: "dashboard", label: "ホーム", icon: Gauge },
  { id: "import", label: "写真取込", icon: FolderDown },
  { id: "review", label: "写真確認", icon: ClipboardCheck },
  { id: "export", label: "書き出し", icon: HardDriveDownload },
  { id: "search", label: "写真検索", icon: Search },
  { id: "settings", label: "設定", icon: Settings }
];

const patients = [
  { id: "P-240015", name: "山田 花子", count: 8, status: "レビュー待ち" },
  { id: "P-240016", name: "佐藤 健", count: 6, status: "確認中" },
  { id: "P-240017", name: "岡田 美咲", count: 10, status: "レビュー待ち" },
  { id: "P-240018", name: "高橋 亮", count: 5, status: "承認済み" }
];

const thumbnails = [
  "正面咬合",
  "右側方面観",
  "左側方面観",
  "上顎咬合面",
  "下顎咬合面",
  "スマイル"
];

const metadata = {
  date: "2026-06-05",
  doctor: "Dr. Nakamura",
  photographer: "M. Tanaka",
  status: "レビュー待ち"
};

const emptyReviewForm: ReviewGroupForm = {
  patient_id: "",
  shooting_date: "",
  doctor_id: "",
  photographer_id: "",
  photo_protocol: defaultPhotoProtocol.value,
  notes: ""
};

const emptySearchFilters: SearchGroupFilters = {
  patientId: "",
  shootingDateFrom: "",
  shootingDateTo: "",
  doctor: "",
  photographer: ""
};

type ReviewOpenTarget = {
  groupId: string;
  status: ReviewGroupListStatus;
};

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [reviewOpenTarget, setReviewOpenTarget] = useState<ReviewOpenTarget | null>(null);

  const title = useMemo(() => {
    return navItems.find((item) => item.id === activeView)?.label ?? "Dashboard";
  }, [activeView]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong>DentalPhoto</strong>
            <span>Organizer</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="メインナビゲーション">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? "nav-item active" : "nav-item"}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>Phase 8-B</span>
          <strong>正式書き出し先記録</strong>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p>口腔内写真整理ソフトウェア</p>
            <h1>{title}</h1>
          </div>
          <div className="operator-chip">
            <UserRound size={18} />
            <span>受付端末 A</span>
          </div>
        </header>

        <section className="content-area">
          {activeView === "dashboard" && <Dashboard />}
          {activeView === "import" && <Import />}
          {activeView === "review" && <Review openTarget={reviewOpenTarget} />}
          {activeView === "export" && (
            <ExportView
              onOpenReview={(groupId) => {
                setReviewOpenTarget({ groupId, status: "approved" });
                setActiveView("review");
              }}
            />
          )}
          {activeView === "search" && (
            <SearchView
              onOpenReview={(groupId, status) => {
                setReviewOpenTarget({ groupId, status });
                setActiveView("review");
              }}
            />
          )}
          {activeView === "settings" && <SettingsView />}
        </section>
      </main>
    </div>
  );
}

function Dashboard() {
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>("checking");
  const [supabaseMessage, setSupabaseMessage] = useState("接続状態を確認しています");
  const [statsResult, setStatsResult] = useState<DashboardStatsResult>({
    status: "loading",
    stats: emptyStats,
    message: "統計情報を読み込んでいます"
  });

  const loadDashboardData = useCallback(async () => {
    setSupabaseStatus("checking");
    setSupabaseMessage("接続状態を確認しています");
    setStatsResult({
      status: "loading",
      stats: emptyStats,
      message: "統計情報を読み込んでいます"
    });

    const [connectionResult, photoStatsResult] = await Promise.all([
      getSupabaseConnectionStatus(),
      fetchDashboardPhotoStats()
    ]);

    setSupabaseStatus(connectionResult.status);
    setSupabaseMessage(connectionResult.message);
    setStatsResult(photoStatsResult);
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const cards = [
    { label: "総画像数", value: statsResult.stats.totalPhotos, icon: ImageIcon, hint: "photos 全件" },
    {
      label: "レビュー待ち件数",
      value: statsResult.stats.pendingReviews,
      icon: ClipboardCheck,
      hint: "review_status = pending"
    },
    {
      label: "本日の取込件数",
      value: statsResult.stats.importedToday,
      icon: HardDriveDownload,
      hint: "今日の0:00以降"
    },
    {
      label: "承認済み件数",
      value: statsResult.stats.approvedPhotos,
      icon: CheckCircle2,
      hint: "review_status = approved"
    }
  ];

  return (
    <div className="dashboard-grid">
      <section className={`dashboard-status ${statsResult.status}`}>
        <div>
          <span>Dashboard統計</span>
          <strong>{getStatsStatusLabel(statsResult.status)}</strong>
          <p>{statsResult.message}</p>
        </div>
        <button className="primary-button" type="button" onClick={loadDashboardData}>
          <RefreshCw size={18} />
          再読み込み
        </button>
      </section>

      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="metric-card" key={card.label}>
            <div className="metric-icon">
              <Icon size={24} />
            </div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value.toLocaleString()}</strong>
              <span>{card.hint}</span>
            </div>
          </article>
        );
      })}

      <SupabaseConnectionCard status={supabaseStatus} message={supabaseMessage} />

      <section className="wide-panel">
        <div>
          <h2>本日の概要</h2>
          <p>Dashboard の数値は Supabase の photos テーブルから取得しています。0件の場合も正常な状態として表示します。</p>
        </div>
        <div className="status-row">
          <span className="status-dot ready" />
          <span>元画像は不変、人間レビュー後に承認</span>
        </div>
      </section>
    </div>
  );
}

function getStatsStatusLabel(status: DashboardStatsResult["status"]) {
  switch (status) {
    case "loading":
      return "読み込み中";
    case "success":
      return "取得成功";
    case "error":
      return "取得失敗";
    case "not-configured":
      return "Supabase未設定";
  }
}

function SupabaseConnectionCard({ status, message }: { status: SupabaseStatus; message: string }) {
  const statusView = {
    checking: {
      label: "確認中",
      className: "checking",
      icon: Wifi
    },
    success: {
      label: "接続成功",
      className: "success",
      icon: Wifi
    },
    failed: {
      label: "接続失敗",
      className: "failed",
      icon: WifiOff
    },
    "not-configured": {
      label: "未設定",
      className: "not-configured",
      icon: ShieldAlert
    }
  } satisfies Record<SupabaseStatus, { label: string; className: string; icon: typeof Wifi }>;

  const view = statusView[status];
  const Icon = view.icon;

  return (
    <section className={`supabase-card ${view.className}`}>
      <div className="supabase-card-header">
        <div className="metric-icon">
          <Icon size={24} />
        </div>
        <div>
          <p>Supabase接続状態</p>
          <strong>{view.label}</strong>
        </div>
      </div>
      <span>{message}</span>
    </section>
  );
}

function Import() {
  const [status, setStatus] = useState<ImportStatus>("未選択");
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<LocalImageFile[]>([]);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [result, setResult] = useState<ImportPhotosResult | null>(null);
  const electronApiType = typeof window.electronAPI;
  const isElectronApiConnected = typeof window.electronAPI?.selectImageFolder === "function";

  const canSelectFolder = isElectronApiConnected && !isSelectingFolder && status !== "取込中";
  const canImport = files.length > 0 && status !== "取込中" && status !== "Supabase未設定";

  const handleSelectFolder = async () => {
    const electronAPI = window.electronAPI;

    if (!electronAPI) {
      setStatus("取込失敗");
      setResult({
        status: "error",
        targetCount: 0,
        insertedCount: 0,
        skippedCount: 0,
        failedCount: 1,
        message: "Electron API未接続のためフォルダ選択を実行できません。Electronウィンドウで起動してください"
      });
      return;
    }

    setIsSelectingFolder(true);
    setResult(null);

    try {
      const selection = await electronAPI.selectImageFolder();

      if (!selection || selection.canceled) {
        setStatus("未選択");
        setFolderPath(null);
        setFiles([]);
        return;
      }

      setFolderPath(selection.folderPath);
      setFiles(selection.files);
      setStatus(selection.files.length > 0 ? "フォルダ選択済み" : "対象ファイルなし");
    } catch {
      setStatus("取込失敗");
      setResult({
        status: "error",
        targetCount: 0,
        insertedCount: 0,
        skippedCount: 0,
        failedCount: 1,
        message: "フォルダ選択または画像一覧取得に失敗しました"
      });
    } finally {
      setIsSelectingFolder(false);
    }
  };

  const handleStartImport = async () => {
    if (files.length === 0) {
      setStatus("対象ファイルなし");
      return;
    }

    setStatus("取込中");
    setResult(null);

    const importResult = await importPhotoMetadata(files);
    setResult(importResult);

    if (importResult.status === "not-configured") {
      setStatus("Supabase未設定");
      return;
    }

    setStatus(importResult.status === "success" ? "取込完了" : "取込失敗");
  };

  return (
    <div className="import-layout">
      <section className="import-panel">
        <div className="panel-heading">
          <HardDriveDownload size={24} />
          <div>
            <h2>ローカル画像メタデータ取込</h2>
            <p>元画像ファイルはコピー・移動・リネームせず、参照情報のみ登録します。</p>
          </div>
        </div>

        <div className="device-box">
          <div>
            <span>選択フォルダ</span>
            <strong>{folderPath ?? "未選択"}</strong>
          </div>
          <button type="button" onClick={handleSelectFolder} disabled={!canSelectFolder}>
            {isSelectingFolder ? "選択中" : "フォルダ選択"}
          </button>
        </div>

        <div className={isElectronApiConnected ? "api-diagnostic connected" : "api-diagnostic disconnected"}>
          <span className={isElectronApiConnected ? "status-dot ready" : "status-dot danger"} />
          <div>
            <strong>{isElectronApiConnected ? "Electron API接続済み" : "Electron API未接続"}</strong>
            <small>Electron API type: {electronApiType}</small>
            <p>
              {isElectronApiConnected
                ? "preload 経由で window.electronAPI.selectImageFolder を利用できます"
                : "ブラウザ単体ではフォルダ選択を実行できません。Electronウィンドウで起動してください"}
            </p>
          </div>
        </div>

        <div className="import-actions">
          <button className="primary-button" type="button" onClick={handleStartImport} disabled={!canImport}>
            取込開始
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("未選択");
              setFolderPath(null);
              setFiles([]);
              setResult(null);
            }}
            disabled={status === "取込中"}
          >
            リセット
          </button>
        </div>

        <div className="file-list-panel">
          <div className="column-title">
            <h2>対象画像ファイル</h2>
            <span>{files.length}件</span>
          </div>
          {files.length === 0 ? (
            <div className="empty-result compact">
              <ImageIcon size={24} />
              <span>jpg / jpeg / png が見つかるとここに表示されます</span>
            </div>
          ) : (
            <div className="file-list">
              {files.map((file) => (
                <div className="file-row" key={file.fileHash}>
                  <div>
                    <strong>{file.originalFilename}</strong>
                    <span>{file.originalPath}</span>
                  </div>
                  <em>{formatFileSize(file.fileSize)}</em>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="status-panel">
        <h3>状態表示</h3>
        <div className="large-status">
          <span className={status === "取込中" ? "pulse-dot" : "status-dot ready"} />
          <strong>{status}</strong>
        </div>
        <ul className="process-list">
          <li>Electron経由でフォルダ選択</li>
          <li>jpg / jpeg / png を抽出</li>
          <li>SHA-256 file_hash を計算</li>
          <li>QRコード検出結果をメタデータとして保存</li>
          <li>photos テーブルへメタデータ登録</li>
        </ul>
        <div className="import-result">
          <h3>取込結果</h3>
          <dl>
            <div>
              <dt>対象件数</dt>
              <dd>{result?.targetCount ?? files.length}</dd>
            </div>
            <div>
              <dt>登録成功</dt>
              <dd>{result?.insertedCount ?? 0}</dd>
            </div>
            <div>
              <dt>重複スキップ</dt>
              <dd>{result?.skippedCount ?? 0}</dd>
            </div>
            <div>
              <dt>失敗</dt>
              <dd>{result?.failedCount ?? 0}</dd>
            </div>
          </dl>
          <p>{result?.message ?? "取込開始後に結果が表示されます"}</p>
        </div>
      </aside>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString()} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  return value || "-";
}

function getExportFilename(photo: ExportGroupPhoto, index: number) {
  const extensionMatch = photo.original_filename.match(/\.[^.]+$/);
  const extension = extensionMatch?.[0].toLowerCase() ?? ".jpg";
  return `${String(index + 1).padStart(3, "0")}${extension}`;
}

function buildOfficialExportFolderPath(exportRootPath: string, group: ExportGroup) {
  const separator = exportRootPath.includes("\\") ? "\\" : "/";
  const root = exportRootPath.replace(/[\\/]+$/, "");
  const shootingDate = sanitizeExportPathSegment(group.shooting_date || "date-unknown");
  const patientId = sanitizeExportPathSegment(group.patient_id || "patient-unknown");
  return [root, shootingDate, patientId].join(separator);
}

function sanitizeExportPathSegment(value: string) {
  const sanitized = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
  return sanitized.length > 0 ? sanitized : "unknown";
}

function countExportPhotos(groups: ExportGroup[]) {
  return groups.reduce((total, group) => total + group.photos.length, 0);
}

function getExportStatusLabel(status: string | null | undefined) {
  if (status === "ready_for_export") {
    return "書き出し待ち";
  }

  if (status === "exported") {
    return "書き出し済み";
  }

  if (status === "export_failed") {
    return "書き出し失敗";
  }

  if (status === "not_exported") {
    return "未書き出し";
  }

  return "未設定";
}

function getReviewStatusDisplayLabel(status: string | null | undefined) {
  if (status === "approved") {
    return "確認完了";
  }

  if (status === "pending") {
    return "確認待ち";
  }

  if (status === "reviewing") {
    return "確認中";
  }

  if (status === "rejected") {
    return "差し戻し";
  }

  return "未設定";
}

function getReviewOpenStatus(status: string | null | undefined): ReviewGroupListStatus {
  return status === "approved" ? "approved" : "pending";
}

function formatGroupOption(group: ReviewGroup) {
  const patientCandidate = getGroupPatientCandidate(group);
  const label = patientCandidate ? `患者候補 ${patientCandidate}` : `患者 ${group.id.slice(0, 8)}`;
  return `${label} / ${group.photo_count}枚`;
}

function getGroupPatientCandidate(group: ReviewGroup | null) {
  return group?.patient_id ?? group?.qr_patient_candidate ?? null;
}

function getReviewStatusLabel(status: ReviewGroup["review_status"]) {
  if (status === "pending") {
    return "未確認";
  }

  if (status === "approved") {
    return "確認完了";
  }

  if (status === "reviewing") {
    return "確認中";
  }

  return "差し戻し";
}

function getAttentionReasonText(group: ReviewGroup | null) {
  return group?.attention_reasons.length ? group.attention_reasons.join(" / ") : "なし";
}

function isQrFilename(filename: string | null | undefined) {
  return Boolean(filename?.toLowerCase().includes("qr"));
}

function hasDetectedQrCode(photo: { code_type?: string | null; code_text?: string | null } | null | undefined) {
  return photo?.code_type?.toLowerCase() === "qrcode" && Boolean(photo.code_text?.trim());
}

function isQrPhoto(photo: ReviewGroupPhoto | null) {
  return hasDetectedQrCode(photo) || isQrFilename(photo?.original_filename);
}

function getInitialPhotoType(
  photo:
    | Pick<ReviewGroupPhoto, "photo_type" | "original_filename" | "code_type" | "code_text">
    | Pick<ExportGroupPhoto, "photo_type" | "original_filename" | "code_type" | "code_text">
) {
  const detectedQr = hasDetectedQrCode(photo) || isQrFilename(photo.original_filename);
  return isPhotoTypeValue(photo.photo_type) ? photo.photo_type : detectedQr ? "qr" : "unclassified";
}

function getPhotoTypeCheckSummary(
  photos: Array<Pick<ExportGroupPhoto, "photo_type" | "original_filename" | "code_type" | "code_text">>,
  protocolValue: string | null | undefined
) {
  const protocol = getPhotoProtocolDefinition(protocolValue);
  const counts = new Map<PhotoTypeValue, number>();

  for (const photo of photos) {
    const photoType = getInitialPhotoType(photo);
    counts.set(photoType, (counts.get(photoType) ?? 0) + 1);
  }

  return {
    protocol,
    missingRequiredTypes: protocol.requiredPhotoTypes
      .filter((photoType) => (counts.get(photoType) ?? 0) === 0)
      .map((photoType) => ({
        value: photoType,
        label: getPhotoTypeLabel(photoType)
      })),
    otherCount: counts.get("other") ?? 0,
    unclassifiedCount: counts.get("unclassified") ?? 0
  };
}

function sortPhotosForDisplay<T extends { original_filename: string; sort_order?: number | null }>(
  photos: T[],
  getType: (photo: T) => string
) {
  return [...photos].sort((a, b) => {
    const typeDiff = getPhotoTypeOrder(getType(a)) - getPhotoTypeOrder(getType(b));
    if (typeDiff !== 0) {
      return typeDiff;
    }

    const sortOrderDiff = (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER);
    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    return a.original_filename.localeCompare(b.original_filename, "ja-JP", { numeric: true, sensitivity: "base" });
  });
}

function roleMatches(staff: StaffMember, keywords: string[]) {
  const role = staff.role?.toLowerCase();
  return Boolean(role && keywords.some((keyword) => role.includes(keyword)));
}

function filterStaffByRole(staff: StaffMember[], keywords: string[]) {
  const matchedStaff = staff.filter((member) => roleMatches(member, keywords));
  return matchedStaff.length > 0 ? matchedStaff : staff;
}

function getMissingReviewFields(form: ReviewGroupForm) {
  const missingFields: string[] = [];

  if (!form.patient_id.trim()) {
    missingFields.push("患者ID");
  }

  if (!form.shooting_date.trim()) {
    missingFields.push("撮影日");
  }

  if (!form.doctor_id.trim()) {
    missingFields.push("担当医");
  }

  if (!form.photographer_id.trim()) {
    missingFields.push("撮影者");
  }

  return missingFields;
}

function getPhotoSlotLabel(index: number) {
  const labels = ["正面", "左側", "右側", "上顎", "下顎"];
  return labels[index] ?? `写真${index + 1}`;
}

function Review({ openTarget }: { openTarget: ReviewOpenTarget | null }) {
  const [reviewListStatus, setReviewListStatus] = useState<ReviewGroupListStatus>("pending");
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [groupPhotos, setGroupPhotos] = useState<ReviewGroupPhoto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewGroupForm>(emptyReviewForm);
  const [loadStatus, setLoadStatus] = useState<ReviewLoadStatus>("読み込み中");
  const [actionStatus, setActionStatus] = useState<ReviewActionStatus>("待機中");
  const [message, setMessage] = useState("確認待ちの患者写真を読み込んでいます");
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("未選択");
  const [previewMessage, setPreviewMessage] = useState("写真を選択するとプレビューを読み込みます");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [setThumbnailUrls, setSetThumbnailUrls] = useState<Record<string, string>>({});
  const [photoThumbnailUrls, setPhotoThumbnailUrls] = useState<Record<string, string>>({});
  const [photoTypeDrafts, setPhotoTypeDrafts] = useState<Record<string, PhotoTypeValue>>({});
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffMessage, setStaffMessage] = useState("スタッフ一覧を読み込んでいます");
  const [moveTargetGroupId, setMoveTargetGroupId] = useState("");
  const [mergeTargetGroupId, setMergeTargetGroupId] = useState("");

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const sortedGroupPhotos = useMemo(
    () => sortPhotosForDisplay(groupPhotos, (photo) => photoTypeDrafts[photo.id] ?? getInitialPhotoType(photo)),
    [groupPhotos, photoTypeDrafts]
  );
  const selectedPhotoProtocol = useMemo(() => getPhotoProtocolDefinition(form.photo_protocol), [form.photo_protocol]);
  const photoTypeCheck = useMemo(() => {
    const counts = new Map<PhotoTypeValue, number>();

    for (const photo of groupPhotos) {
      const photoType = photoTypeDrafts[photo.id] ?? getInitialPhotoType(photo);
      counts.set(photoType, (counts.get(photoType) ?? 0) + 1);
    }

    return {
      missingRequiredTypes: selectedPhotoProtocol.requiredPhotoTypes
        .filter((photoType) => (counts.get(photoType) ?? 0) === 0)
        .map((photoType) => ({
          value: photoType,
          label: getPhotoTypeLabel(photoType)
        })),
      otherCount: counts.get("other") ?? 0,
      unclassifiedCount: counts.get("unclassified") ?? 0
    };
  }, [groupPhotos, photoTypeDrafts, selectedPhotoProtocol]);
  const selectedPhoto = groupPhotos.find((photo) => photo.id === selectedPhotoId) ?? sortedGroupPhotos[0] ?? null;
  const selectedPatientCandidate = getGroupPatientCandidate(selectedGroup);
  const selectedAttentionReasons = getAttentionReasonText(selectedGroup);
  const otherGroups = useMemo(
    () => (selectedGroup ? groups.filter((group) => group.id !== selectedGroup.id) : []),
    [groups, selectedGroup]
  );
  const doctorOptions = useMemo(() => filterStaffByRole(staffMembers, ["doctor", "dentist", "医師", "担当医"]), [staffMembers]);
  const photographerOptions = useMemo(
    () => filterStaffByRole(staffMembers, ["photographer", "hygienist", "assistant", "撮影", "衛生士", "助手"]),
    [staffMembers]
  );
  const isApprovedMode = reviewListStatus === "approved";
  const canReturnToPending = Boolean(selectedGroup && selectedGroup.review_status === "approved" && selectedGroup.export_status !== "exported");

  const loadGroups = useCallback(async (preferredGroupId?: string | null, statusOverride?: ReviewGroupListStatus) => {
    const targetStatus = statusOverride ?? reviewListStatus;
    setLoadStatus("読み込み中");
    setActionStatus("待機中");
    setMessage(targetStatus === "pending" ? "確認待ちの患者を読み込んでいます" : "確認済みの患者を読み込んでいます");

    const result = await fetchReviewGroupsByStatus(targetStatus);

    if (result.status === "not-configured") {
      setGroups([]);
      setGroupPhotos([]);
      setSelectedGroupId(null);
      setForm(emptyReviewForm);
      setLoadStatus("Supabase未設定");
      setMessage(result.message);
      return;
    }

    if (result.status === "error") {
      setGroups([]);
      setGroupPhotos([]);
      setSelectedGroupId(null);
      setForm(emptyReviewForm);
      setLoadStatus("取得失敗");
      setMessage(result.message);
      return;
    }

    setGroups(result.groups);
    const nextSelectedGroupId =
      (preferredGroupId && result.groups.some((group) => group.id === preferredGroupId) ? preferredGroupId : null) ??
      result.groups[0]?.id ??
      null;
    setSelectedGroupId(nextSelectedGroupId);
    setLoadStatus(result.groups.length > 0 ? "表示中" : "データなし");
    setMessage(
      result.groups.length > 0
        ? targetStatus === "pending"
          ? "確認待ちの患者を表示しています"
          : "確認済みの患者を表示しています"
        : targetStatus === "pending"
          ? "確認待ちの患者はいません"
          : "確認済みの患者はいません"
    );
  }, [reviewListStatus]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (!openTarget) {
      return;
    }

    setReviewListStatus(openTarget.status);
    void loadGroups(openTarget.groupId, openTarget.status);
  }, [loadGroups, openTarget]);

  useEffect(() => {
    let isCurrent = true;

    void fetchStaffMembers().then((result) => {
      if (!isCurrent) {
        return;
      }

      setStaffMembers(result.staff);
      setStaffMessage(result.message);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const previewApi = window.electronAPI?.loadImagePreview;
    const thumbnailTargets = groups
      .filter((group) => group.representative_photo_path)
      .slice(0, 30)
      .map((group) => ({
        groupId: group.id,
        path: group.representative_photo_path as string
      }));

    setSetThumbnailUrls({});

    if (!previewApi || thumbnailTargets.length === 0) {
      return () => {
        isCurrent = false;
      };
    }

    void Promise.all(
      thumbnailTargets.map(async (target) => {
        try {
          const result = await previewApi(target.path);
          return result.status === "success" && result.dataUrl ? [target.groupId, result.dataUrl] : null;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (!isCurrent) {
        return;
      }

      setSetThumbnailUrls(Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry))));
    });

    return () => {
      isCurrent = false;
    };
  }, [groups]);

  useEffect(() => {
    let isCurrent = true;
    const previewApi = window.electronAPI?.loadImagePreview;
    const thumbnailTargets = groupPhotos
      .filter((photo) => photo.original_path)
      .slice(0, 24)
      .map((photo) => ({
        photoId: photo.id,
        path: photo.original_path as string
      }));

    setPhotoThumbnailUrls({});

    if (!previewApi || thumbnailTargets.length === 0) {
      return () => {
        isCurrent = false;
      };
    }

    void Promise.all(
      thumbnailTargets.map(async (target) => {
        try {
          const result = await previewApi(target.path);
          return result.status === "success" && result.dataUrl ? [target.photoId, result.dataUrl] : null;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (!isCurrent) {
        return;
      }

      setPhotoThumbnailUrls(Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry))));
    });

    return () => {
      isCurrent = false;
    };
  }, [groupPhotos]);

  useEffect(() => {
    let isCurrent = true;

    setGroupPhotos([]);
    setSelectedPhotoId(null);

    if (!selectedGroup) {
      return () => {
        isCurrent = false;
      };
    }

    void fetchReviewGroupPhotos(selectedGroup.id).then((result) => {
      if (!isCurrent) {
        return;
      }

      if (result.status !== "success") {
        setGroupPhotos([]);
        setSelectedPhotoId(null);
        setMessage(result.message);
        return;
      }

      setGroupPhotos(result.photos);
      setSelectedPhotoId(sortPhotosForDisplay(result.photos, getInitialPhotoType)[0]?.id ?? null);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) {
      setForm(emptyReviewForm);
      return;
    }

    setForm({
      patient_id: selectedGroup.patient_id ?? selectedGroup.qr_patient_candidate ?? "",
      shooting_date: selectedGroup.shooting_date ?? "",
      doctor_id: selectedGroup.doctor_id ?? "",
      photographer_id: selectedGroup.photographer_id ?? "",
      photo_protocol: isPhotoProtocolValue(selectedGroup.photo_protocol) ? selectedGroup.photo_protocol : defaultPhotoProtocol.value,
      notes: selectedGroup.notes ?? ""
    });
  }, [selectedGroup]);

  useEffect(() => {
    setPhotoTypeDrafts(
      Object.fromEntries(groupPhotos.map((photo) => [photo.id, getInitialPhotoType(photo)])) as Record<string, PhotoTypeValue>
    );
  }, [groupPhotos]);

  const getDraftPhotoType = (photo: ReviewGroupPhoto) => photoTypeDrafts[photo.id] ?? getInitialPhotoType(photo);

  const updatePhotoTypeDraft = (photoId: string, value: string) => {
    setPhotoTypeDrafts((current) => ({
      ...current,
      [photoId]: value as PhotoTypeValue
    }));
  };

  const buildPhotoTypeUpdates = (): PhotoTypeUpdate[] =>
    groupPhotos.map((photo) => ({
      photoId: photo.id,
      photoType: getDraftPhotoType(photo)
    }));

  useEffect(() => {
    const nextTargetGroupId = otherGroups[0]?.id ?? "";
    setMoveTargetGroupId((current) => (current && otherGroups.some((group) => group.id === current) ? current : nextTargetGroupId));
    setMergeTargetGroupId((current) => (current && otherGroups.some((group) => group.id === current) ? current : nextTargetGroupId));
  }, [otherGroups]);

  useEffect(() => {
    let isCurrent = true;

    setPreviewDataUrl(null);

    if (!selectedPhoto) {
      setPreviewStatus("未選択");
      setPreviewMessage("写真を選択するとプレビューを読み込みます");
      return () => {
        isCurrent = false;
      };
    }

    if (!selectedPhoto.original_path) {
      setPreviewStatus("読み込み失敗");
      setPreviewMessage("original_path が空です");
      return () => {
        isCurrent = false;
      };
    }

    if (!window.electronAPI?.loadImagePreview) {
      setPreviewStatus("Electron API未接続");
      setPreviewMessage("Electronウィンドウ内でのみローカル画像をプレビューできます");
      return () => {
        isCurrent = false;
      };
    }

    setPreviewStatus("読み込み中");
    setPreviewMessage("画像プレビューを読み込んでいます");

    void window.electronAPI
      .loadImagePreview(selectedPhoto.original_path)
      .then((result) => {
        if (!isCurrent) {
          return;
        }

        if (result.status === "success" && result.dataUrl) {
          setPreviewDataUrl(result.dataUrl);
          setPreviewStatus("表示中");
          setPreviewMessage(result.message);
          return;
        }

        setPreviewDataUrl(null);
        setPreviewStatus(result.status === "unsupported" ? "未対応形式" : "読み込み失敗");
        setPreviewMessage(result.message);
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setPreviewDataUrl(null);
        setPreviewStatus("読み込み失敗");
        setPreviewMessage("画像ファイルの読み込みに失敗しました");
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedPhoto]);

  const updateFormValue = (field: keyof ReviewGroupForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedGroup) {
      return;
    }

    setActionStatus("一時保存中");
    setMessage("一時保存しています");

    const result = await updateReviewGroupMetadata(selectedGroup.id, form, buildPhotoTypeUpdates());

    if (result.status !== "success" || !result.group) {
      setActionStatus("一時保存失敗");
      setMessage(result.message);
      return;
    }

    setGroups((current) => current.map((group) => (group.id === result.group?.id ? result.group : group)));
    setActionStatus("一時保存成功");
    setMessage(result.message);
  };

  const handleApprove = async () => {
    if (!selectedGroup) {
      return;
    }

    const warnings: string[] = [];
    const missingFields = getMissingReviewFields(form);

    if (missingFields.length > 0) {
      warnings.push(`未入力: ${missingFields.join("、")}`);
    }

    if (selectedGroup.needs_review_label) {
      warnings.push(`要確認: ${getAttentionReasonText(selectedGroup)}`);
    }

    if (warnings.length > 0) {
      const confirmed = window.confirm(`確認が必要な項目があります。\n${warnings.join("\n")}\nこのまま確定しますか？`);

      if (!confirmed) {
        return;
      }
    }

    setActionStatus("確認完了中");
    setMessage("入力内容を保存したうえで、確認完了にしています");

    const result = await completeReviewGroup(selectedGroup.id, form, buildPhotoTypeUpdates());

    if (result.status !== "success") {
      setActionStatus("確認完了失敗");
      setMessage(result.message);
      return;
    }

    const remainingGroups = groups.filter((group) => group.id !== selectedGroup.id);
    setGroups(remainingGroups);
    setSelectedGroupId(remainingGroups[0]?.id ?? null);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    setLoadStatus(remainingGroups.length > 0 ? "表示中" : "データなし");
    setActionStatus("確認完了成功");
    setMessage(result.message);
  };

  const handleReturnToPending = async () => {
    if (!selectedGroup) {
      return;
    }

    if (selectedGroup.export_status === "exported") {
      setActionStatus("差し戻し失敗");
      setMessage("この患者は書き出し済みのため、確認待ちには戻せません");
      return;
    }

    const confirmed = window.confirm(
      "この患者の写真を確認待ちに戻しますか？\n書き出し前の写真のみ対象です。"
    );

    if (!confirmed) {
      return;
    }

    setActionStatus("差し戻し中");
    setMessage("この患者の写真を確認待ちに戻しています");

    const result = await returnReviewGroupToPending(selectedGroup.id);

    if (result.status !== "success") {
      setActionStatus("差し戻し失敗");
      setMessage(result.message);
      return;
    }

    const returnedGroupId = result.group?.id ?? selectedGroup.id;
    setReviewListStatus("pending");
    setGroups([]);
    setSelectedGroupId(null);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    setActionStatus("差し戻し成功");
    setMessage("確認待ちに戻しました。確認待ち一覧を再読み込みしています");
    await loadGroups(returnedGroupId, "pending");
  };

  const handleMovePhoto = async () => {
    if (!selectedPhoto || !moveTargetGroupId) {
      return;
    }

    setActionStatus("移動中");
    setMessage("写真を別の患者へ移動しています");

    const result = await movePhotoToGroup(selectedPhoto.id, moveTargetGroupId);

    if (result.status !== "success" || !result.groupId) {
      setActionStatus("移動失敗");
      setMessage(result.message);
      return;
    }

    setActionStatus("移動成功");
    setMessage(result.message);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    await loadGroups(result.groupId);
  };

  const handleSplitPhoto = async () => {
    if (!selectedPhoto) {
      return;
    }

    setActionStatus("分離中");
    setMessage("写真を新しい患者として分けています");

    const result = await splitPhotoToNewGroup(selectedPhoto.id);

    if (result.status !== "success" || !result.groupId) {
      setActionStatus("分離失敗");
      setMessage(result.message);
      return;
    }

    setActionStatus("分離成功");
    setMessage(result.message);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    await loadGroups(result.groupId);
  };

  const handleMergeGroup = async () => {
    if (!selectedGroup || !mergeTargetGroupId) {
      return;
    }

    const targetGroup = groups.find((group) => group.id === mergeTargetGroupId);
    const targetLabel =
      targetGroup?.patient_id ?? targetGroup?.qr_patient_candidate ?? targetGroup?.id.slice(0, 8) ?? mergeTargetGroupId.slice(0, 8);
    const confirmed = window.confirm(`選択中の患者の写真を ${targetLabel} にまとめます。よろしいですか？`);

    if (!confirmed) {
      return;
    }

    setActionStatus("統合中");
    setMessage("同じ患者の写真としてまとめています");

    const result = await mergeGroups(selectedGroup.id, mergeTargetGroupId);

    if (result.status !== "success" || !result.groupId) {
      setActionStatus("統合失敗");
      setMessage(result.message);
      return;
    }

    setActionStatus("統合成功");
    setMessage(result.message);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    await loadGroups(result.groupId);
  };

  const handleRegroupByQrBoundaries = async () => {
    const confirmed = window.confirm(
      "確認待ち写真を、検出済みQR情報を優先して患者ごとに分け直します。確認完了済み写真と元画像ファイルは変更しません。よろしいですか？"
    );

    if (!confirmed) {
      return;
    }

    setActionStatus("分け直し中");
    setMessage("QRをもとに患者ごとに分け直しています");

    const result = await regroupPendingPhotosByQrBoundaries();

    if (result.status !== "success") {
      setActionStatus("分け直し失敗");
      setMessage(result.message);
      return;
    }

    setActionStatus("分け直し成功");
    setMessage(result.message);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    await loadGroups(result.groupId);
  };

  const isBusy =
    actionStatus === "一時保存中" ||
    actionStatus === "確認完了中" ||
    actionStatus === "差し戻し中" ||
    actionStatus === "移動中" ||
    actionStatus === "分離中" ||
    actionStatus === "統合中" ||
    actionStatus === "分け直し中" ||
    loadStatus === "読み込み中";

  return (
    <div className="review-page">
      <div className="review-guidance">
        QRコード画像を境界として自動作成された患者ごとの写真です。患者ID候補と写真のまとまりを確認してください。
      </div>
      <div className="review-mode-tabs" role="tablist" aria-label="確認状態の切り替え">
        <button
          className={reviewListStatus === "pending" ? "active" : ""}
          type="button"
          onClick={() => setReviewListStatus("pending")}
          disabled={isBusy}
        >
          確認待ち
        </button>
        <button
          className={reviewListStatus === "approved" ? "active" : ""}
          type="button"
          onClick={() => setReviewListStatus("approved")}
          disabled={isBusy}
        >
          確認済み
        </button>
      </div>
      <div className="review-layout">
      <aside className="patient-column">
        <div className="column-title">
          <h2>患者ごとの写真一覧</h2>
          <span>{groups.length}件</span>
        </div>
        <div className={`review-status ${loadStatus === "取得失敗" ? "error" : ""}`}>
          <strong>{loadStatus}</strong>
          <span>{message}</span>
        </div>
        <button className="review-refresh-button" type="button" onClick={() => void loadGroups()} disabled={isBusy}>
          <RefreshCw size={16} />
          再読み込み
        </button>
        {reviewListStatus === "pending" && (
          <button className="review-refresh-button" type="button" onClick={handleRegroupByQrBoundaries} disabled={isBusy}>
            QRをもとに患者ごとに分け直す
          </button>
        )}
        <div className="patient-list review-photo-list">
          {groups.map((group, index) => (
            <button
              key={group.id}
              className={selectedGroup?.id === group.id ? "patient-item set-item active" : "patient-item set-item"}
              onClick={() => setSelectedGroupId(group.id)}
              type="button"
            >
              <div className="set-thumbnail">
                {setThumbnailUrls[group.id] ? (
                  <img src={setThumbnailUrls[group.id]} alt={group.representative_photo_filename ?? `患者 ${index + 1}`} />
                ) : (
                  <ImageIcon size={22} />
                )}
              </div>
              <div className="set-summary">
                <strong>患者 {index + 1}</strong>
                <span>患者ID候補: {getGroupPatientCandidate(group) ?? "なし"}</span>
                <span>
                  {group.photo_count}枚 / {group.has_qr_photo ? "QRあり" : "QRなし"}
                </span>
                {reviewListStatus === "approved" && (
                  <>
                    <span>撮影日: {formatDate(group.shooting_date)}</span>
                    <span>出力状態: {group.export_status}</span>
                    <small>確認日時: {formatDateTime(group.approved_at)}</small>
                  </>
                )}
                <div className="set-badges">
                  <em>{getReviewStatusLabel(group.review_status)}</em>
                  {group.needs_review_label && <b>要確認</b>}
                </div>
                {group.needs_review_label && <small className="attention-reasons">理由: {getAttentionReasonText(group)}</small>}
                <small>{formatDateTime(group.created_at)}</small>
              </div>
            </button>
          ))}
          {groups.length === 0 && (
            <div className="empty-result compact">
              <ClipboardCheck size={24} />
              <span>
                {loadStatus === "読み込み中"
                  ? "読み込み中"
                  : reviewListStatus === "pending"
                    ? "確認待ちの患者はいません"
                    : "確認済みの患者はいません"}
              </span>
            </div>
          )}
        </div>
      </aside>

      <section className="thumbnail-column">
        <div className="column-title">
          <h2>この患者の写真</h2>
          <span>{selectedGroup ? `${groupPhotos.length}枚` : "未選択"}</span>
        </div>
        {selectedGroup ? (
          <div className="review-detail">
            <section className={selectedGroup.needs_review_label ? "set-overview attention" : "set-overview"}>
              <div className="set-overview-header">
                <div>
                  <h3>患者の写真概要</h3>
                  <p>患者ID候補: {selectedPatientCandidate ?? "なし"}</p>
                </div>
                {selectedGroup.needs_review_label ? <strong>要確認</strong> : <strong className="clear">通常確認</strong>}
              </div>
              <dl>
                <div>
                  <dt>写真枚数</dt>
                  <dd>{selectedGroup.photo_count}枚</dd>
                </div>
                <div>
                  <dt>QR</dt>
                  <dd>{selectedGroup.has_qr_photo ? `QRあり (${selectedGroup.qr_photo_count}枚)` : "QRなし"}</dd>
                </div>
                <div>
                  <dt>要確認理由</dt>
                  <dd>{selectedAttentionReasons}</dd>
                </div>
              </dl>
              <div className="photo-type-check-panel">
                <strong>撮影基準チェック</strong>
                {selectedPhotoProtocol.value === "fourteen_view" ? (
                  <p className="photo-type-check-message">14枚法の詳細チェックは今後対応予定です。撮影方法は保存されています。</p>
                ) : selectedPhotoProtocol.value === "partial" ? (
                  <p className="photo-type-check-message">部分撮影として確認します。不足判定は行いません。</p>
                ) : selectedPhotoProtocol.value === "other" ? (
                  <p className="photo-type-check-message">その他の撮影方法として確認します。不足判定は行いません。</p>
                ) : photoTypeCheck.missingRequiredTypes.length === 0 ? (
                  <p className="photo-type-check-message complete">
                    {selectedPhotoProtocol.label}の基本写真が揃っています
                  </p>
                ) : (
                  <div className="photo-type-check-section">
                    <p>{selectedPhotoProtocol.label}で確認が必要な写真</p>
                    <span>不足している可能性があります</span>
                    <ul>
                      {photoTypeCheck.missingRequiredTypes.map((item) => (
                        <li key={item.value}>{item.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(photoTypeCheck.otherCount > 0 || photoTypeCheck.unclassifiedCount > 0) && (
                  <div className="photo-type-check-cautions">
                    {photoTypeCheck.otherCount > 0 && (
                      <div>
                        <p>基本分類以外の写真があります</p>
                        <span>要確認: その他 {photoTypeCheck.otherCount}枚</span>
                      </div>
                    )}
                    {photoTypeCheck.unclassifiedCount > 0 && (
                      <div>
                        <p>未分類の写真があります</p>
                        <span>要確認: 未分類 {photoTypeCheck.unclassifiedCount}枚</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
            <div className={`preview-frame ${previewStatus === "表示中" ? "ready" : ""}`}>
              {isQrPhoto(selectedPhoto) && <span className="preview-type-badge">QR画像</span>}
              {previewStatus === "表示中" && previewDataUrl ? (
                <img src={previewDataUrl} alt={selectedPhoto?.original_filename ?? "preview"} className="review-preview-image" />
              ) : (
                <div className="preview-placeholder">
                  <ImageIcon size={36} />
                  <strong>{previewStatus}</strong>
                  <span>{previewMessage}</span>
                </div>
              )}
            </div>

            {selectedPhoto && (
              <label className="selected-photo-type-control">
                撮影種別
                <select
                  value={getDraftPhotoType(selectedPhoto)}
                  onChange={(event) => updatePhotoTypeDraft(selectedPhoto.id, event.target.value)}
                  disabled={isBusy || isApprovedMode}
                >
                  {photoTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="group-photo-grid">
              {sortedGroupPhotos.map((photo) => (
                <article
                  key={photo.id}
                  className={selectedPhoto?.id === photo.id ? "group-photo-card active" : "group-photo-card"}
                >
                  <button className="group-photo-select-button" type="button" onClick={() => setSelectedPhotoId(photo.id)}>
                  <span className="group-photo-thumb">
                    {photoThumbnailUrls[photo.id] ? (
                      <img src={photoThumbnailUrls[photo.id]} alt={photo.original_filename} />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                    {isQrPhoto(photo) && <em>QR</em>}
                  </span>
                  <strong>{getPhotoTypeLabel(getDraftPhotoType(photo))}</strong>
                  <span>{photo.original_filename}</span>
                  </button>
                  <label className="photo-type-select">
                    撮影種別
                    <select
                      value={getDraftPhotoType(photo)}
                      onChange={(event) => updatePhotoTypeDraft(photo.id, event.target.value)}
                      disabled={isBusy || isApprovedMode}
                    >
                      {photoTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
              {groupPhotos.length === 0 && (
                <div className="empty-result compact">
                  <ImageIcon size={24} />
                  <span>この患者には写真がありません</span>
                </div>
              )}
            </div>
            {selectedPhoto && (
              <section className="selected-photo-summary">
                <h3>選択中の写真</h3>
                <dl>
                  <div>
                    <dt>ファイル名</dt>
                    <dd>{selectedPhoto.original_filename}</dd>
                  </div>
                  <div>
                    <dt>撮影種別</dt>
                    <dd>{getPhotoTypeLabel(getDraftPhotoType(selectedPhoto))}</dd>
                  </div>
                  <div>
                    <dt>QR情報</dt>
                    <dd>{isQrPhoto(selectedPhoto) ? "QR情報あり" : "QR情報なし"}</dd>
                  </div>
                </dl>
              </section>
            )}
            {selectedPhoto && (
              <details className="technical-detail-panel">
                <summary>写真の詳細情報を表示</summary>
                <dl className="detail-list">
                  <div>
                    <dt>original_filename</dt>
                    <dd>{selectedPhoto.original_filename}</dd>
                  </div>
                  <div>
                    <dt>original_path</dt>
                    <dd>{selectedPhoto.original_path ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>file_hash</dt>
                    <dd>{selectedPhoto.file_hash ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>mime_type</dt>
                    <dd>{selectedPhoto.mime_type ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Code Type</dt>
                    <dd>{selectedPhoto.code_type ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Code Text</dt>
                    <dd>{selectedPhoto.code_text ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>file_size</dt>
                    <dd>{formatFileSize(selectedPhoto.file_size ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>imported_at</dt>
                    <dd>{formatDateTime(selectedPhoto.imported_at ?? null)}</dd>
                  </div>
                  <div>
                    <dt>review_status</dt>
                    <dd>{selectedPhoto.review_status ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>export_status</dt>
                    <dd>{selectedPhoto.export_status ?? "-"}</dd>
                  </div>
                </dl>
              </details>
            )}
          </div>
        ) : (
          <div className="empty-result">
            <Database size={28} />
            <span>写真を選択すると詳細が表示されます</span>
          </div>
        )}
      </section>

      <aside className="metadata-column">
        <div className="column-title">
          <h2>写真確認</h2>
          <span>{actionStatus}</span>
        </div>
        <form className="metadata-form">
          <section className="metadata-section">
            <h3>患者情報</h3>
            <label>
              患者ID
              <input
                value={form.patient_id}
                onChange={(event) => updateFormValue("patient_id", event.target.value)}
                disabled={!selectedGroup || isBusy || isApprovedMode}
                placeholder="例: 0001"
              />
            </label>
            <label>
              撮影日
              <input
                type="date"
                value={form.shooting_date}
                onChange={(event) => updateFormValue("shooting_date", event.target.value)}
                disabled={!selectedGroup || isBusy || isApprovedMode}
              />
            </label>
            <label>
              撮影方法
              <select
                value={form.photo_protocol}
                onChange={(event) => updateFormValue("photo_protocol", event.target.value)}
                disabled={!selectedGroup || isBusy || isApprovedMode}
              >
                {photoProtocolDefinitions.map((protocol) => (
                  <option key={protocol.value} value={protocol.value}>
                    {protocol.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              担当医
              <select
                value={form.doctor_id}
                onChange={(event) => updateFormValue("doctor_id", event.target.value)}
                disabled={!selectedGroup || isBusy || isApprovedMode}
              >
                <option value="">選択してください</option>
                {doctorOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              撮影者
              <select
                value={form.photographer_id}
                onChange={(event) => updateFormValue("photographer_id", event.target.value)}
                disabled={!selectedGroup || isBusy || isApprovedMode}
              >
                <option value="">選択してください</option>
                {photographerOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              メモ
              <textarea
                value={form.notes}
                onChange={(event) => updateFormValue("notes", event.target.value)}
                disabled={!selectedGroup || isBusy || isApprovedMode}
                placeholder="確認内容や申し送りを入力"
              />
            </label>
            <p className="staff-load-message">{staffMessage}</p>
          </section>
          {reviewListStatus === "pending" && (
            <section className="metadata-section photo-organization-section">
              <h3>写真の整理</h3>
              <div className="selected-photo-line">
                <span>選択中の写真</span>
                <strong>{selectedPhoto ? selectedPhoto.original_filename : "写真未選択"}</strong>
              </div>
              <div className="photo-organization-action">
                <h4>この写真が別の患者のものだった場合</h4>
                <p>別の患者の写真が混ざっていた場合に使います。</p>
                <label>
                  移動先の患者
                  <select
                    value={moveTargetGroupId}
                    onChange={(event) => setMoveTargetGroupId(event.target.value)}
                    disabled={!selectedPhoto || otherGroups.length === 0 || isBusy}
                  >
                    {otherGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {formatGroupOption(group)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleMovePhoto}
                  disabled={!selectedPhoto || !moveTargetGroupId || isBusy}
                >
                  この写真を移動
                </button>
              </div>
              <div className="photo-organization-action">
                <h4>この写真だけ別に分けたい場合</h4>
                <p>この写真を、現在の患者から分けたい場合に使います。</p>
                <button type="button" onClick={handleSplitPhoto} disabled={!selectedPhoto || isBusy}>
                  新しい患者として分ける
                </button>
              </div>
              <div className="photo-organization-action subtle">
                <h4>同じ患者の写真が分かれている場合</h4>
                <p>同じ患者の写真が複数に分かれている場合に使います。</p>
                <label>
                  まとめ先の患者
                  <select
                    value={mergeTargetGroupId}
                    onChange={(event) => setMergeTargetGroupId(event.target.value)}
                    disabled={!selectedGroup || otherGroups.length === 0 || isBusy}
                  >
                    {otherGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {formatGroupOption(group)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondary-action-button"
                  type="button"
                  onClick={handleMergeGroup}
                  disabled={!selectedGroup || !mergeTargetGroupId || isBusy}
                >
                  同じ患者の写真としてまとめる
                </button>
              </div>
            </section>
          )}
          {reviewListStatus === "pending" ? (
            <section className="metadata-section confirmation-section">
              <h3>確認操作</h3>
              <div className="confirmation-actions">
                <div className="confirmation-action-card">
                  <button className="secondary-action-button" type="button" onClick={handleSave} disabled={!selectedGroup || isBusy}>
                    一時保存
                  </button>
                  <p>入力内容を保存します。確認完了にはしません。</p>
                </div>
                <div className="confirmation-action-card primary">
                  <button className="primary-button approve-button" type="button" onClick={handleApprove} disabled={!selectedGroup || isBusy}>
                    <CheckCircle2 size={18} />
                    確認完了
                  </button>
                  <p>写真と患者情報を確認済みにし、書き出し待ちにします。</p>
                </div>
              </div>
            </section>
          ) : (
            <div className="return-review-panel">
              <p>この患者の写真を確認待ちに戻します。患者IDや担当医などを再編集できます。</p>
              {selectedGroup?.export_status === "exported" && (
                <strong>この患者は書き出し済みのため、確認待ちには戻せません。</strong>
              )}
              <button
                className="secondary-action-button"
                type="button"
                onClick={handleReturnToPending}
                disabled={!canReturnToPending || isBusy}
              >
                確認待ちに戻す
              </button>
            </div>
          )}
          <p className="review-action-message">{message}</p>
        </form>
      </aside>
      </div>
    </div>
  );
}


function ExportView({ onOpenReview }: { onOpenReview: (groupId: string) => void }) {
  const [groups, setGroups] = useState<ExportGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [exportThumbnailUrls, setExportThumbnailUrls] = useState<Record<string, string>>({});
  const [loadStatus, setLoadStatus] = useState<ExportLoadStatus>("読み込み中");
  const [actionStatus, setActionStatus] = useState<ExportActionStatus>("待機中");
  const [message, setMessage] = useState("書き出し対象を読み込んでいます");
  const [exportRootPath, setExportRootPath] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    successGroupCount: number;
    successPhotoCount: number;
    failedPhotoCount: number;
    failures: Array<{ originalFilename: string; message: string }>;
  } | null>(null);

  const isElectronApiConnected =
    typeof window.electronAPI?.selectExportFolder === "function" &&
    typeof window.electronAPI?.exportPhotoFiles === "function";
  const isBusy = loadStatus === "読み込み中" || actionStatus === "フォルダ選択中" || actionStatus === "書き出し中";
  const targetPhotoCount = countExportPhotos(groups);
  const canExport = isElectronApiConnected && Boolean(exportRootPath) && groups.length > 0 && targetPhotoCount > 0 && !isBusy;
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const sortedSelectedExportPhotos = useMemo(
    () => (selectedGroup ? sortPhotosForDisplay(selectedGroup.photos, getInitialPhotoType) : []),
    [selectedGroup]
  );
  const selectedExportPhotoTypeCheck = useMemo(
    () => (selectedGroup ? getPhotoTypeCheckSummary(selectedGroup.photos, selectedGroup.photo_protocol) : null),
    [selectedGroup]
  );

  const loadExportTargets = useCallback(async () => {
    setLoadStatus("読み込み中");
    setActionStatus("待機中");
    setMessage("書き出し対象を読み込んでいます");

    const result = await fetchReadyExportGroups();

    if (result.status === "not-configured") {
      setGroups([]);
      setLoadStatus("Supabase未設定");
      setMessage(result.message);
      return;
    }

    if (result.status === "error") {
      setGroups([]);
      setLoadStatus("取得失敗");
      setMessage(result.message);
      return;
    }

    setGroups(result.groups);
    setSelectedGroupId((current) => (current && result.groups.some((group) => group.id === current) ? current : result.groups[0]?.id ?? null));
    setLoadStatus(result.groups.length > 0 ? "表示中" : "データなし");
    setMessage(result.message);
  }, []);

  useEffect(() => {
    void loadExportTargets();
  }, [loadExportTargets]);

  useEffect(() => {
    let isCurrent = true;
    const previewApi = window.electronAPI?.loadImagePreview;
    const thumbnailTargets = (selectedGroup?.photos ?? [])
      .filter((photo) => photo.original_path)
      .slice(0, 24)
      .map((photo) => ({
        photoId: photo.id,
        path: photo.original_path as string
      }));

    setExportThumbnailUrls({});

    if (!previewApi || thumbnailTargets.length === 0) {
      return () => {
        isCurrent = false;
      };
    }

    void Promise.all(
      thumbnailTargets.map(async (target) => {
        try {
          const result = await previewApi(target.path);
          return result.status === "success" && result.dataUrl ? [target.photoId, result.dataUrl] : null;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (!isCurrent) {
        return;
      }

      setExportThumbnailUrls(Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry))));
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedGroup]);

  const handleSelectExportFolder = async () => {
    if (!window.electronAPI?.selectExportFolder) {
      setActionStatus("書き出し失敗");
      setMessage("書き出し機能を利用できないため、書き出し先フォルダを選択できません");
      return;
    }

    setActionStatus("フォルダ選択中");
    setResultSummary(null);

    try {
      const selection = await window.electronAPI.selectExportFolder();

      if (!selection || selection.canceled) {
        setActionStatus("待機中");
        return;
      }

      setExportRootPath(selection.folderPath);
      setActionStatus("待機中");
      setMessage("書き出し先フォルダを選択しました");
    } catch {
      setActionStatus("書き出し失敗");
      setMessage("書き出し先フォルダの選択に失敗しました");
    }
  };

  const handleStartExport = async () => {
    if (!window.electronAPI?.exportPhotoFiles || !exportRootPath) {
      setActionStatus("書き出し失敗");
      setMessage("書き出し機能を利用できない、または書き出し先フォルダが未選択です");
      return;
    }

    setActionStatus("書き出し中");
    setMessage("元の写真を変更せず、書き出し先へコピーしています");
    setResultSummary(null);

    const copyPayload = {
      exportRootPath,
      groups: groups.map((group) => ({
        groupId: group.id,
        patientId: group.patient_id,
        shootingDate: group.shooting_date,
        photos: group.photos.map((photo, index) => ({
          photoId: photo.id,
          originalPath: photo.original_path,
          originalFilename: photo.original_filename,
          exportFilename: getExportFilename(photo, index)
        }))
      }))
    };

    try {
      const copyResult = await window.electronAPI.exportPhotoFiles(copyPayload);

      if (copyResult.successGroupIds.length > 0) {
        const successfulGroups: MarkExportedGroup[] = groups
          .filter((group) => copyResult.successGroupIds.includes(group.id))
          .map((group) => ({
            groupId: group.id,
            officialExportFolderPath: buildOfficialExportFolderPath(exportRootPath, group)
          }));
        const markResult = await markGroupsExported(successfulGroups);

        if (markResult.status !== "success") {
          setActionStatus("書き出し失敗");
          setMessage(`コピー後のDB更新に失敗しました: ${markResult.message}`);
          return;
        }
      }

      setResultSummary({
        successGroupCount: copyResult.successGroupIds.length,
        successPhotoCount: copyResult.successPhotoCount,
        failedPhotoCount: copyResult.failedPhotoCount,
        failures: copyResult.failures.map((failure) => ({
          originalFilename: failure.originalFilename || "写真",
          message: failure.message
        }))
      });
      setActionStatus(copyResult.status === "success" ? "書き出し完了" : "書き出し失敗");
      setMessage(
        copyResult.status === "success"
          ? "書き出しが完了しました"
          : "一部の写真を書き出しできませんでした。失敗した患者は書き出し待ちのまま残ります"
      );
      await loadExportTargets();
    } catch {
      setActionStatus("書き出し失敗");
      setMessage("書き出し処理に失敗しました");
    }
  };

  return (
    <div className="export-page">
      <section className="export-summary-panel">
        <div className="panel-heading">
          <HardDriveDownload size={24} />
          <div>
            <h2>書き出し</h2>
            <p>確認完了した写真を、患者ごとのフォルダへコピーします。元の写真は変更されません。</p>
            <p>書き出し成功後、この患者の正式書き出し先として保存されます。</p>
          </div>
        </div>

        <div className="export-metrics">
          <article>
            <span>書き出し対象の患者</span>
            <strong>{groups.length.toLocaleString()}件</strong>
          </article>
          <article>
            <span>対象写真数</span>
            <strong>{targetPhotoCount.toLocaleString()}枚</strong>
          </article>
          <article>
            <span>状態</span>
            <strong>{loadStatus}</strong>
          </article>
        </div>

        <div className={isElectronApiConnected ? "api-diagnostic connected compact" : "api-diagnostic disconnected"}>
          <span className={isElectronApiConnected ? "status-dot ready" : "status-dot danger"} />
          <div>
            <strong>{isElectronApiConnected ? "書き出し機能: 利用可能" : "書き出し機能: 利用できません"}</strong>
            <p>
              {isElectronApiConnected
                ? "書き出し先フォルダを選び、元の写真を変更せずコピーできます"
                : "ブラウザ単体では書き出しできません。Electronウィンドウで起動してください"}
            </p>
          </div>
        </div>

        <div className="export-folder-row">
          <div>
            <span>書き出し先フォルダ</span>
            <strong>{exportRootPath ?? "未選択"}</strong>
          </div>
          <button type="button" onClick={handleSelectExportFolder} disabled={!isElectronApiConnected || isBusy}>
            フォルダを選択
          </button>
        </div>

        <div className="export-actions">
          <button className="primary-button" type="button" onClick={handleStartExport} disabled={!canExport}>
            書き出し開始
          </button>
          <p>選択したフォルダに、患者ごとのフォルダを作成してコピーします。</p>
          <button type="button" onClick={() => void loadExportTargets()} disabled={isBusy}>
            再読み込み
          </button>
        </div>

        <div className={`review-status ${actionStatus === "書き出し失敗" ? "error" : ""}`}>
          <strong>{actionStatus}</strong>
          <span>{message}</span>
        </div>

        {selectedGroup ? (
          <section className="export-preview-panel">
            <div className="column-title">
              <h2>書き出し前の最終確認</h2>
              <span>{selectedGroup.photos.length}枚</span>
            </div>
            <dl className="export-preview-meta">
              <div>
                <dt>患者ID</dt>
                <dd>{selectedGroup.patient_id ?? "未設定"}</dd>
              </div>
              <div>
                <dt>撮影日</dt>
                <dd>{formatDate(selectedGroup.shooting_date)}</dd>
              </div>
              <div>
                <dt>写真枚数</dt>
                <dd>{selectedGroup.photos.length}枚</dd>
              </div>
              <div>
                <dt>撮影方法</dt>
                <dd>{getPhotoProtocolLabel(selectedGroup.photo_protocol)}</dd>
              </div>
              <div>
                <dt>担当医</dt>
                <dd>{selectedGroup.doctor_name ?? "-"}</dd>
              </div>
              <div>
                <dt>撮影者</dt>
                <dd>{selectedGroup.photographer_name ?? "-"}</dd>
              </div>
              <div>
                <dt>状態</dt>
                <dd>{getReviewStatusDisplayLabel(selectedGroup.review_status)} / {getExportStatusLabel(selectedGroup.export_status)}</dd>
              </div>
            </dl>
            {selectedExportPhotoTypeCheck && (
              <div className="export-photo-check-panel">
                <strong>撮影基準チェック</strong>
                {selectedExportPhotoTypeCheck.protocol.value === "fourteen_view" ? (
                  <p className="photo-type-check-message">14枚法の詳細チェックは今後対応予定です。撮影方法は保存されています。</p>
                ) : selectedExportPhotoTypeCheck.protocol.value === "partial" ? (
                  <p className="photo-type-check-message">部分撮影として確認します。不足判定は行いません。</p>
                ) : selectedExportPhotoTypeCheck.protocol.value === "other" ? (
                  <p className="photo-type-check-message">その他の撮影方法として確認します。不足判定は行いません。</p>
                ) : selectedExportPhotoTypeCheck.missingRequiredTypes.length === 0 ? (
                  <p className="photo-type-check-message complete">
                    {selectedExportPhotoTypeCheck.protocol.label}の基本写真が揃っています
                  </p>
                ) : (
                  <div className="photo-type-check-section">
                    <p>確認が必要な写真があります</p>
                    <span>{selectedExportPhotoTypeCheck.protocol.label}で不足している可能性があります</span>
                    <ul>
                      {selectedExportPhotoTypeCheck.missingRequiredTypes.map((item) => (
                        <li key={item.value}>{item.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(selectedExportPhotoTypeCheck.otherCount > 0 || selectedExportPhotoTypeCheck.unclassifiedCount > 0) && (
                  <div className="photo-type-check-cautions">
                    {selectedExportPhotoTypeCheck.otherCount > 0 && (
                      <div>
                        <p>基本分類以外の写真があります</p>
                        <span>要確認: その他 {selectedExportPhotoTypeCheck.otherCount}枚</span>
                      </div>
                    )}
                    {selectedExportPhotoTypeCheck.unclassifiedCount > 0 && (
                      <div>
                        <p>未分類の写真があります</p>
                        <span>要確認: 未分類 {selectedExportPhotoTypeCheck.unclassifiedCount}枚</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="export-preview-header">
              <div>
                <strong>この患者の写真</strong>
                <p>写真の移動や分類修正が必要な場合は、写真確認画面に戻って修正します。</p>
              </div>
              <button type="button" onClick={() => onOpenReview(selectedGroup.id)}>
                写真確認に戻る
              </button>
            </div>
            <div className="export-photo-strip">
              {sortedSelectedExportPhotos.map((photo) => (
                <div className="export-photo-thumb-card" key={photo.id}>
                  <span className="group-photo-thumb">
                    {exportThumbnailUrls[photo.id] ? (
                      <img src={exportThumbnailUrls[photo.id]} alt={photo.original_filename} />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                    {(hasDetectedQrCode(photo) || isQrFilename(photo.original_filename)) && <em>QR</em>}
                  </span>
                  <strong>{getPhotoTypeLabel(getInitialPhotoType(photo))}</strong>
                  <span>{photo.original_filename}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-result compact">
            <HardDriveDownload size={24} />
            <span>患者を選択すると、書き出し前の最終確認が表示されます</span>
          </div>
        )}

        {resultSummary && (
          <section className="export-result-panel">
            <h3>書き出し結果</h3>
            <dl>
              <div>
                <dt>成功した患者</dt>
                <dd>{resultSummary.successGroupCount}件</dd>
              </div>
              <div>
                <dt>成功した写真</dt>
                <dd>{resultSummary.successPhotoCount}枚</dd>
              </div>
              <div>
                <dt>失敗した写真</dt>
                <dd>{resultSummary.failedPhotoCount}枚</dd>
              </div>
            </dl>
            {resultSummary.failures.length > 0 && (
              <div className="export-failure-list">
                <strong>失敗</strong>
                {resultSummary.failures.map((failure, index) => (
                  <p key={`${failure.originalFilename}-${index}`}>
                    {failure.originalFilename}: {failure.message}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}
      </section>

      <aside className="export-target-panel">
        <div className="column-title">
          <h2>書き出し対象の患者</h2>
          <span>{groups.length}件</span>
        </div>
        <div className="export-target-list">
          {groups.map((group) => (
            <button
              className={selectedGroup?.id === group.id ? "export-target-card active" : "export-target-card"}
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
            >
              <strong>{group.patient_id ?? "患者ID未設定"}</strong>
              <span>撮影日: {formatDate(group.shooting_date)}</span>
              <span>写真枚数: {group.photos.length}枚</span>
              <span>担当医: {group.doctor_name ?? "-"}</span>
              <span>撮影者: {group.photographer_name ?? "-"}</span>
              <em>状態: {getReviewStatusDisplayLabel(group.review_status)} / {getExportStatusLabel(group.export_status)}</em>
            </button>
          ))}
          {groups.length === 0 && (
            <div className="empty-result compact">
              <HardDriveDownload size={24} />
              <span>{loadStatus === "読み込み中" ? "読み込み中" : "書き出し対象はありません"}</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function SearchView({ onOpenReview }: { onOpenReview: (groupId: string, status: ReviewGroupListStatus) => void }) {
  const [filters, setFilters] = useState<SearchGroupFilters>(emptySearchFilters);
  const [results, setResults] = useState<SearchGroupResult[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"待機中" | "検索中" | "表示中" | "データなし" | "取得失敗" | "Supabase未設定">("待機中");
  const [message, setMessage] = useState("条件を入力して検索してください");

  const isSearching = status === "検索中";

  const updateFilter = (field: keyof SearchGroupFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    setStatus("検索中");
    setMessage("患者ごとの写真を検索しています");

    const result = await searchPatientPhotoGroups(filters);

    if (result.status === "not-configured") {
      setResults([]);
      setStatus("Supabase未設定");
      setMessage(result.message);
      return;
    }

    if (result.status === "error") {
      setResults([]);
      setStatus("取得失敗");
      setMessage(result.message);
      return;
    }

    setResults(result.groups);
    setStatus(result.groups.length > 0 ? "表示中" : "データなし");
    setMessage(result.message);
  };

  const handleClear = () => {
    setFilters(emptySearchFilters);
    setResults([]);
    setStatus("待機中");
    setMessage("条件を入力して検索してください");
  };

  useEffect(() => {
    void handleSearch();
    // Initial load only; user changes are searched explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const previewApi = window.electronAPI?.loadImagePreview;
    const thumbnailTargets = results
      .flatMap((group) => group.preview_photos)
      .filter((photo) => photo.original_path)
      .slice(0, 100)
      .map((photo) => ({
        photoId: photo.id,
        path: photo.original_path as string
      }));

    setThumbnailUrls({});

    if (!previewApi || thumbnailTargets.length === 0) {
      return () => {
        isCurrent = false;
      };
    }

    void Promise.all(
      thumbnailTargets.map(async (target) => {
        try {
          const result = await previewApi(target.path);
          return result.status === "success" && result.dataUrl ? [target.photoId, result.dataUrl] : null;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (!isCurrent) {
        return;
      }

      setThumbnailUrls(Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry))));
    });

    return () => {
      isCurrent = false;
    };
  }, [results]);

  return (
    <div className="search-layout">
      <section className="form-panel">
        <h2>検索条件</h2>
        <div className="search-grid">
          <label>
            患者ID
            <input
              value={filters.patientId}
              onChange={(event) => updateFilter("patientId", event.target.value)}
              placeholder="例: 0001"
            />
          </label>
          <label>
            撮影日 From
            <input
              type="date"
              value={filters.shootingDateFrom}
              onChange={(event) => updateFilter("shootingDateFrom", event.target.value)}
            />
          </label>
          <label>
            撮影日 To
            <input
              type="date"
              value={filters.shootingDateTo}
              onChange={(event) => updateFilter("shootingDateTo", event.target.value)}
            />
          </label>
          <label>
            担当医
            <input
              value={filters.doctor}
              onChange={(event) => updateFilter("doctor", event.target.value)}
              placeholder="名前またはID"
            />
          </label>
          <label>
            撮影者
            <input
              value={filters.photographer}
              onChange={(event) => updateFilter("photographer", event.target.value)}
              placeholder="名前またはID"
            />
          </label>
        </div>
        <div className="search-actions">
          <button className="primary-button" type="button" onClick={handleSearch} disabled={isSearching}>
            <Search size={18} />
            検索
          </button>
          <button type="button" onClick={handleClear} disabled={isSearching}>
            条件をクリア
          </button>
        </div>
        <div className={`review-status ${status === "取得失敗" ? "error" : ""}`}>
          <strong>{status}</strong>
          <span>{message}</span>
        </div>
      </section>
      <section className="results-panel">
        <div className="column-title">
          <h2>検索結果</h2>
          <span>{results.length}件</span>
        </div>
        {results.length > 0 ? (
          <div className="search-result-list">
            {results.map((group) => (
              <article className="search-result-card" key={group.id}>
                <div>
                  <strong>{group.patient_id ?? "患者ID未設定"}</strong>
                  <span>{group.photo_count}枚</span>
                </div>
                <SearchResultThumbnails photos={group.preview_photos} thumbnailUrls={thumbnailUrls} />
                <dl>
                  <div>
                    <dt>撮影日</dt>
                    <dd>{formatDate(group.shooting_date)}</dd>
                  </div>
                  <div>
                    <dt>撮影方法</dt>
                    <dd>{getPhotoProtocolLabel(group.photo_protocol)}</dd>
                  </div>
                  <div>
                    <dt>担当医</dt>
                    <dd>{group.doctor_name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>撮影者</dt>
                    <dd>{group.photographer_name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>写真確認状態</dt>
                    <dd>{getReviewStatusDisplayLabel(group.review_status)}</dd>
                  </div>
                  <div>
                    <dt>書き出し状態</dt>
                    <dd>{getExportStatusLabel(group.export_status)}</dd>
                  </div>
                  <div>
                    <dt>正式書き出し先</dt>
                    <dd title={group.official_export_folder_path ?? undefined}>
                      {group.official_export_folder_path ? "記録あり" : "未記録"}
                    </dd>
                  </div>
                </dl>
                <button
                  className="secondary-action-button"
                  type="button"
                  onClick={() => onOpenReview(group.id, getReviewOpenStatus(group.review_status))}
                >
                  写真確認で開く
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-result">
            <Database size={28} />
            <span>{isSearching ? "検索中" : message}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function SearchResultThumbnails({
  photos,
  thumbnailUrls
}: {
  photos: SearchGroupPhoto[];
  thumbnailUrls: Record<string, string>;
}) {
  if (photos.length === 0) {
    return <div className="search-thumbnail-empty">写真プレビューなし</div>;
  }

  return (
    <div className="search-thumbnail-strip" aria-label="この患者の写真サムネイル">
      {photos.slice(0, 5).map((photo) => (
        <div className="search-thumbnail" key={photo.id}>
          {thumbnailUrls[photo.id] ? (
            <img src={thumbnailUrls[photo.id]} alt={photo.original_filename} />
          ) : (
            <div className="search-thumbnail-placeholder">
              <ImageIcon size={18} />
            </div>
          )}
          <span>{getSearchPhotoTypeLabel(photo)}</span>
        </div>
      ))}
    </div>
  );
}

function getSearchPhotoTypeLabel(photo: SearchGroupPhoto) {
  if (!photo.photo_type && photo.code_type === "qrcode") {
    return getPhotoTypeLabel("qr");
  }

  return getPhotoTypeLabel(photo.photo_type);
}

function SettingsView() {
  return (
    <div className="settings-layout">
      <section className="form-panel">
        <h2>アプリ設定</h2>
        <label>
          取込元フォルダ
          <input value="E:\\DCIM" readOnly />
        </label>
        <label>
          保存先フォルダ
          <input value="D:\\DentalPhotoArchive" readOnly />
        </label>
        <label className="toggle-row">
          <span>
            レビュー必須設定
            <small>取込後に必ず承認フローへ送る</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
      </section>

      <aside className="app-info">
        <h2>アプリ情報</h2>
        <dl>
          <div>
            <dt>製品名</dt>
            <dd>DentalPhotoOrganizer</dd>
          </div>
          <div>
            <dt>バージョン</dt>
            <dd>0.9.1 Phase 8-B</dd>
          </div>
          <div>
            <dt>構成</dt>
            <dd>Electron + React + TypeScript + Supabase</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

export default App;
