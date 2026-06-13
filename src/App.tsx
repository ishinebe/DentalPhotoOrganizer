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
  fetchReadyExportGroups,
  markGroupsExported,
  type ExportGroup,
  type ExportGroupPhoto
} from "./lib/exportGroups";
import { importPhotoMetadata, type ImportPhotosResult, type LocalImageFile } from "./lib/importPhotos";
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
  | "保存中"
  | "保存成功"
  | "保存失敗"
  | "承認中"
  | "承認成功"
  | "承認失敗"
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
  | "セット再作成中"
  | "セット再作成成功"
  | "セット再作成失敗";
type PreviewStatus = "未選択" | "読み込み中" | "表示中" | "読み込み失敗" | "未対応形式" | "Electron API未接続";
type ExportLoadStatus = "読み込み中" | "表示中" | "データなし" | "取得失敗" | "Supabase未設定";
type ExportActionStatus = "待機中" | "フォルダ選択中" | "エクスポート中" | "エクスポート完了" | "エクスポート失敗";

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
  { id: "export", label: "エクスポート", icon: HardDriveDownload },
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
  notes: ""
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
          <span>Phase 6-B</span>
          <strong>確認済みセット再編集</strong>
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
          {activeView === "search" && <SearchView />}
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

function countExportPhotos(groups: ExportGroup[]) {
  return groups.reduce((total, group) => total + group.photos.length, 0);
}

function formatGroupOption(group: ReviewGroup) {
  const patientCandidate = getGroupPatientCandidate(group);
  const label = patientCandidate ? `患者候補 ${patientCandidate}` : `撮影セット ${group.id.slice(0, 8)}`;
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
    return "レビュー完了";
  }

  if (status === "reviewing") {
    return "確認中";
  }

  return "差し戻し";
}

function getAttentionReasonText(group: ReviewGroup | null) {
  return group?.attention_reasons.length ? group.attention_reasons.join(" / ") : "なし";
}

function isQrPhoto(photo: ReviewGroupPhoto | null) {
  return Boolean(photo?.original_filename.toLowerCase().includes("qr"));
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
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffMessage, setStaffMessage] = useState("スタッフ一覧を読み込んでいます");
  const [moveTargetGroupId, setMoveTargetGroupId] = useState("");
  const [mergeTargetGroupId, setMergeTargetGroupId] = useState("");

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const selectedPhoto = groupPhotos.find((photo) => photo.id === selectedPhotoId) ?? groupPhotos[0] ?? null;
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
    setMessage(targetStatus === "pending" ? "確認待ちの撮影セットを読み込んでいます" : "確認済みの撮影セットを読み込んでいます");

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
          ? "確認待ちの撮影セットを表示しています"
          : "確認済みの撮影セットを表示しています"
        : targetStatus === "pending"
          ? "確認待ちの撮影セットはありません"
          : "確認済みの撮影セットはありません"
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
      setSelectedPhotoId(result.photos[0]?.id ?? null);
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
      notes: selectedGroup.notes ?? ""
    });
  }, [selectedGroup]);

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

    setActionStatus("保存中");
    setMessage("レビュー内容を保存しています");

    const result = await updateReviewGroupMetadata(selectedGroup.id, form);

    if (result.status !== "success" || !result.group) {
      setActionStatus("保存失敗");
      setMessage(result.message);
      return;
    }

    setGroups((current) => current.map((group) => (group.id === result.group?.id ? result.group : group)));
    setActionStatus("保存成功");
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

    setActionStatus("承認中");
    setMessage("入力内容を保存したうえで、撮影セットを確認済みにしています");

    const result = await completeReviewGroup(selectedGroup.id, form);

    if (result.status !== "success") {
      setActionStatus("承認失敗");
      setMessage(result.message);
      return;
    }

    const remainingGroups = groups.filter((group) => group.id !== selectedGroup.id);
    setGroups(remainingGroups);
    setSelectedGroupId(remainingGroups[0]?.id ?? null);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    setLoadStatus(remainingGroups.length > 0 ? "表示中" : "データなし");
    setActionStatus("承認成功");
    setMessage(result.message);
  };

  const handleReturnToPending = async () => {
    if (!selectedGroup) {
      return;
    }

    if (selectedGroup.export_status === "exported") {
      setActionStatus("差し戻し失敗");
      setMessage("この撮影セットは出力済みのため、確認待ちには戻せません");
      return;
    }

    const confirmed = window.confirm(
      "この撮影セットを確認待ちに戻しますか？\nエクスポート前の撮影セットのみ対象です。"
    );

    if (!confirmed) {
      return;
    }

    setActionStatus("差し戻し中");
    setMessage("撮影セットを確認待ちに戻しています");

    const result = await returnReviewGroupToPending(selectedGroup.id);

    if (result.status !== "success") {
      setActionStatus("差し戻し失敗");
      setMessage(result.message);
      return;
    }

    const remainingGroups = groups.filter((group) => group.id !== selectedGroup.id);
    setGroups(remainingGroups);
    setSelectedGroupId(remainingGroups[0]?.id ?? null);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    setLoadStatus(remainingGroups.length > 0 ? "表示中" : "データなし");
    setActionStatus("差し戻し成功");
    setMessage("確認待ちに戻しました。確認待ちタブで再編集できます");
  };

  const handleMovePhoto = async () => {
    if (!selectedPhoto || !moveTargetGroupId) {
      return;
    }

    setActionStatus("移動中");
    setMessage("写真を別の撮影セットへ移動しています");

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
    setMessage("写真を新しい撮影セットへ分離しています");

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
    const confirmed = window.confirm(`選択中の撮影セットを ${targetLabel} に統合します。よろしいですか？`);

    if (!confirmed) {
      return;
    }

    setActionStatus("統合中");
    setMessage("撮影セットを統合しています");

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
      "pending写真の撮影セット所属を整理し、ファイル名のQR境界で撮影セットを再作成します。approved写真と元画像ファイルは変更しません。よろしいですか？"
    );

    if (!confirmed) {
      return;
    }

    setActionStatus("セット再作成中");
    setMessage("QR境界で撮影セットを再作成しています");

    const result = await regroupPendingPhotosByQrBoundaries();

    if (result.status !== "success") {
      setActionStatus("セット再作成失敗");
      setMessage(result.message);
      return;
    }

    setActionStatus("セット再作成成功");
    setMessage(result.message);
    setGroupPhotos([]);
    setSelectedPhotoId(null);
    await loadGroups(result.groupId);
  };

  const isBusy =
    actionStatus === "保存中" ||
    actionStatus === "承認中" ||
    actionStatus === "差し戻し中" ||
    actionStatus === "移動中" ||
    actionStatus === "分離中" ||
    actionStatus === "統合中" ||
    actionStatus === "セット再作成中" ||
    loadStatus === "読み込み中";

  return (
    <div className="review-page">
      <div className="review-guidance">
        QRコード画像を境界として自動作成された撮影セットです。患者ID候補と写真のまとまりを確認してください。
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
          <h2>撮影セット一覧</h2>
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
            QR境界で撮影セット再作成
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
                  <img src={setThumbnailUrls[group.id]} alt={group.representative_photo_filename ?? `撮影セット ${index + 1}`} />
                ) : (
                  <ImageIcon size={22} />
                )}
              </div>
              <div className="set-summary">
                <strong>撮影セット {index + 1}</strong>
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
                    ? "確認待ち撮影セットはありません"
                    : "確認済み撮影セットはありません"}
              </span>
            </div>
          )}
        </div>
      </aside>

      <section className="thumbnail-column">
        <div className="column-title">
          <h2>撮影セット内写真</h2>
          <span>{selectedGroup ? `${groupPhotos.length}枚` : "未選択"}</span>
        </div>
        {selectedGroup ? (
          <div className="review-detail">
            <section className={selectedGroup.needs_review_label ? "set-overview attention" : "set-overview"}>
              <div className="set-overview-header">
                <div>
                  <h3>撮影セット概要</h3>
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

            <div className="group-photo-grid">
              {groupPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  className={selectedPhoto?.id === photo.id ? "group-photo-card active" : "group-photo-card"}
                  type="button"
                  onClick={() => setSelectedPhotoId(photo.id)}
                >
                  <span className="group-photo-thumb">
                    {photoThumbnailUrls[photo.id] ? (
                      <img src={photoThumbnailUrls[photo.id]} alt={photo.original_filename} />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                    {isQrPhoto(photo) && <em>QR</em>}
                  </span>
                  <strong>{getPhotoSlotLabel(index)}</strong>
                  <span>{photo.original_filename}</span>
                </button>
              ))}
              {groupPhotos.length === 0 && (
                <div className="empty-result compact">
                  <ImageIcon size={24} />
                  <span>この撮影セットには写真がありません</span>
                </div>
              )}
            </div>
            {reviewListStatus === "pending" && (
            <div className="group-edit-panel">
              <div className="group-edit-header">
                <strong>選択中の写真を修正</strong>
                <span>{selectedPhoto ? selectedPhoto.original_filename : "写真未選択"}</span>
              </div>
              <label>
                移動先撮影セット
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
              <div className="group-edit-actions">
                <button
                  type="button"
                  onClick={handleMovePhoto}
                  disabled={!selectedPhoto || !moveTargetGroupId || isBusy}
                >
                  別の撮影セットへ移動
                </button>
                <button type="button" onClick={handleSplitPhoto} disabled={!selectedPhoto || isBusy}>
                  新しい撮影セットへ分離
                </button>
              </div>
            </div>
            )}
            <dl className="detail-list">
              <div>
                <dt>original_filename</dt>
                <dd>{selectedPhoto?.original_filename ?? "-"}</dd>
              </div>
              <div>
                <dt>original_path</dt>
                <dd>{selectedPhoto?.original_path ?? "-"}</dd>
              </div>
              <div>
                <dt>file_hash</dt>
                <dd>{selectedPhoto?.file_hash ?? "-"}</dd>
              </div>
              <div>
                <dt>mime_type</dt>
                <dd>{selectedPhoto?.mime_type ?? "-"}</dd>
              </div>
              <div>
                <dt>Code Type</dt>
                <dd>{selectedPhoto?.code_type ?? "-"}</dd>
              </div>
              <div>
                <dt>Code Text</dt>
                <dd>{selectedPhoto?.code_text ?? "-"}</dd>
              </div>
              <div>
                <dt>file_size</dt>
                <dd>{formatFileSize(selectedPhoto?.file_size ?? 0)}</dd>
              </div>
              <div>
                <dt>imported_at</dt>
                <dd>{formatDateTime(selectedPhoto?.imported_at ?? null)}</dd>
              </div>
              <div>
                <dt>review_status</dt>
                <dd>{selectedPhoto?.review_status ?? "-"}</dd>
              </div>
              <div>
                <dt>export_status</dt>
                <dd>{selectedPhoto?.export_status ?? "-"}</dd>
              </div>
            </dl>
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
          <h2>撮影セット情報</h2>
          <span>{actionStatus}</span>
        </div>
        <form className="metadata-form">
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
          <div className="review-button-notes">
            <p>レビュー内容を保存: 入力内容だけを保存します。確認完了にはなりません。</p>
            <p>問題なしで確定: 入力内容を保存したうえで、この撮影セットを確認済みにします。</p>
          </div>
          {reviewListStatus === "pending" && (
          <div className="group-merge-panel">
            <label>
              統合先撮影セット
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
              他の撮影セットと統合
            </button>
          </div>
          )}
          {reviewListStatus === "pending" ? (
            <>
              <button className="primary-button approve-button" type="button" onClick={handleSave} disabled={!selectedGroup || isBusy}>
                レビュー内容を保存
              </button>
              <button className="primary-button approve-button" type="button" onClick={handleApprove} disabled={!selectedGroup || isBusy}>
                <CheckCircle2 size={18} />
                問題なしで確定
              </button>
            </>
          ) : (
            <div className="return-review-panel">
              <p>この撮影セットを確認待ちに戻します。患者IDや担当医などを再編集できます。</p>
              {selectedGroup?.export_status === "exported" && (
                <strong>この撮影セットは出力済みのため、確認待ちには戻せません。</strong>
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
  const [message, setMessage] = useState("エクスポート対象を読み込んでいます");
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
  const isBusy = loadStatus === "読み込み中" || actionStatus === "フォルダ選択中" || actionStatus === "エクスポート中";
  const targetPhotoCount = countExportPhotos(groups);
  const canExport = isElectronApiConnected && Boolean(exportRootPath) && groups.length > 0 && targetPhotoCount > 0 && !isBusy;
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;

  const loadExportTargets = useCallback(async () => {
    setLoadStatus("読み込み中");
    setActionStatus("待機中");
    setMessage("エクスポート対象を読み込んでいます");

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
      setActionStatus("エクスポート失敗");
      setMessage("Electron API未接続のため出力先フォルダを選択できません");
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
      setMessage("出力先フォルダを選択しました");
    } catch {
      setActionStatus("エクスポート失敗");
      setMessage("出力先フォルダの選択に失敗しました");
    }
  };

  const handleStartExport = async () => {
    if (!window.electronAPI?.exportPhotoFiles || !exportRootPath) {
      setActionStatus("エクスポート失敗");
      setMessage("Electron API未接続、または出力先フォルダが未選択です");
      return;
    }

    setActionStatus("エクスポート中");
    setMessage("元画像を変更せず、出力先へコピーしています");
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
        const markResult = await markGroupsExported(copyResult.successGroupIds);

        if (markResult.status !== "success") {
          setActionStatus("エクスポート失敗");
          setMessage(`コピー後のDB更新に失敗しました: ${markResult.message}`);
          return;
        }
      }

      setResultSummary({
        successGroupCount: copyResult.successGroupIds.length,
        successPhotoCount: copyResult.successPhotoCount,
        failedPhotoCount: copyResult.failedPhotoCount,
        failures: copyResult.failures.map((failure) => ({
          originalFilename: failure.originalFilename || "撮影セット",
          message: failure.message
        }))
      });
      setActionStatus(copyResult.status === "success" ? "エクスポート完了" : "エクスポート失敗");
      setMessage(
        copyResult.status === "success"
          ? "エクスポートが完了しました"
          : "一部の写真をエクスポートできませんでした。失敗した撮影セットは ready_for_export のまま残ります"
      );
      await loadExportTargets();
    } catch {
      setActionStatus("エクスポート失敗");
      setMessage("エクスポート処理に失敗しました");
    }
  };

  return (
    <div className="export-page">
      <section className="export-summary-panel">
        <div className="panel-heading">
          <HardDriveDownload size={24} />
          <div>
            <h2>エクスポート</h2>
            <p>レビュー完了済みで、まだ出力されていない撮影セットをコピー出力します。</p>
          </div>
        </div>

        <div className="export-metrics">
          <article>
            <span>対象撮影セット数</span>
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

        <div className={isElectronApiConnected ? "api-diagnostic connected" : "api-diagnostic disconnected"}>
          <span className={isElectronApiConnected ? "status-dot ready" : "status-dot danger"} />
          <div>
            <strong>{isElectronApiConnected ? "Electron API接続済み" : "Electron API未接続"}</strong>
            <p>
              {isElectronApiConnected
                ? "出力先フォルダ選択とローカルファイルコピーを preload 経由で実行できます"
                : "ブラウザ単体ではエクスポートできません。Electronウィンドウで起動してください"}
            </p>
          </div>
        </div>

        <div className="export-folder-row">
          <div>
            <span>出力先フォルダ</span>
            <strong>{exportRootPath ?? "未選択"}</strong>
          </div>
          <button type="button" onClick={handleSelectExportFolder} disabled={!isElectronApiConnected || isBusy}>
            フォルダを選択
          </button>
        </div>

        <div className="export-actions">
          <button className="primary-button" type="button" onClick={handleStartExport} disabled={!canExport}>
            エクスポート開始
          </button>
          <button type="button" onClick={() => void loadExportTargets()} disabled={isBusy}>
            再読み込み
          </button>
        </div>

        <div className={`review-status ${actionStatus === "エクスポート失敗" ? "error" : ""}`}>
          <strong>{actionStatus}</strong>
          <span>{message}</span>
        </div>

        {selectedGroup ? (
          <section className="export-preview-panel">
            <div className="column-title">
              <h2>選択中の撮影セット確認</h2>
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
                <dt>担当医</dt>
                <dd>{selectedGroup.doctor_name ?? "-"}</dd>
              </div>
              <div>
                <dt>撮影者</dt>
                <dd>{selectedGroup.photographer_name ?? "-"}</dd>
              </div>
              <div>
                <dt>status</dt>
                <dd>
                  {selectedGroup.review_status} / {selectedGroup.export_status}
                </dd>
              </div>
            </dl>
            <div className="export-preview-header">
              <strong>撮影セット内写真</strong>
              <button type="button" onClick={() => onOpenReview(selectedGroup.id)}>
                確認画面で開く
              </button>
            </div>
            <div className="export-photo-strip">
              {selectedGroup.photos.map((photo, index) => (
                <div className="export-photo-thumb-card" key={photo.id}>
                  <span className="group-photo-thumb">
                    {exportThumbnailUrls[photo.id] ? (
                      <img src={exportThumbnailUrls[photo.id]} alt={photo.original_filename} />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                    {photo.original_filename.toLowerCase().includes("qr") && <em>QR</em>}
                  </span>
                  <strong>{getPhotoSlotLabel(index)}</strong>
                  <span>{photo.original_filename}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-result compact">
            <HardDriveDownload size={24} />
            <span>撮影セットを選択すると、エクスポート前確認が表示されます</span>
          </div>
        )}

        {resultSummary && (
          <section className="export-result-panel">
            <h3>エクスポート結果</h3>
            <dl>
              <div>
                <dt>成功した撮影セット</dt>
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
          <h2>対象撮影セット一覧</h2>
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
              <em>{group.export_status}</em>
            </button>
          ))}
          {groups.length === 0 && (
            <div className="empty-result compact">
              <HardDriveDownload size={24} />
              <span>{loadStatus === "読み込み中" ? "読み込み中" : "エクスポート対象はありません"}</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function SearchView() {
  return (
    <div className="search-layout">
      <section className="form-panel">
        <h2>検索条件</h2>
        <div className="search-grid">
          <label>
            患者ID検索
            <input placeholder="例: P-240015" />
          </label>
          <label>
            撮影日検索
            <input type="date" />
          </label>
          <label>
            担当医検索
            <input placeholder="例: Dr. Nakamura" />
          </label>
          <label>
            撮影者検索
            <input placeholder="例: M. Tanaka" />
          </label>
        </div>
        <button className="primary-button" type="button">
          <Search size={18} />
          検索
        </button>
      </section>
      <section className="results-panel">
        <h2>検索結果</h2>
        <div className="empty-result">
          <Database size={28} />
          <span>検索処理はダミー実装です</span>
        </div>
      </section>
    </div>
  );
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
            <dd>0.7.1 Phase 6-B</dd>
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
