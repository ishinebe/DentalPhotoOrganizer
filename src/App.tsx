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
import { importPhotoMetadata, type ImportPhotosResult, type LocalImageFile } from "./lib/importPhotos";
import {
  completeReviewGroup,
  fetchPendingReviewGroups,
  fetchReviewGroupPhotos,
  type ReviewGroup,
  type ReviewGroupForm,
  type ReviewGroupPhoto,
  updateReviewGroupMetadata
} from "./lib/reviewGroups";
import { getSupabaseConnectionStatus } from "./lib/supabase";

type View = "dashboard" | "import" | "review" | "search" | "settings";
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
  | "承認失敗";
type PreviewStatus = "未選択" | "読み込み中" | "表示中" | "読み込み失敗" | "未対応形式" | "Electron API未接続";

const emptyStats = {
  totalPhotos: 0,
  pendingReviews: 0,
  importedToday: 0,
  approvedPhotos: 0
};

const navItems: Array<{ id: View; label: string; icon: typeof Gauge }> = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "import", label: "Import", icon: FolderDown },
  { id: "review", label: "Review", icon: ClipboardCheck },
  { id: "search", label: "Search", icon: Search },
  { id: "settings", label: "Settings", icon: Settings }
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
  provisional_patient_id: "",
  doctor_name: "",
  photographer_name: "",
  notes: ""
};

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");

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
          <span>Phase 3-B</span>
          <strong>Group review workflow</strong>
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
          {activeView === "review" && <Review />}
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

function getPhotoSlotLabel(index: number) {
  const labels = ["正面", "左側", "右側", "上顎", "下顎"];
  return labels[index] ?? `写真${index + 1}`;
}

function Review() {
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [groupPhotos, setGroupPhotos] = useState<ReviewGroupPhoto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewGroupForm>(emptyReviewForm);
  const [loadStatus, setLoadStatus] = useState<ReviewLoadStatus>("読み込み中");
  const [actionStatus, setActionStatus] = useState<ReviewActionStatus>("待機中");
  const [message, setMessage] = useState("レビュー待ちグループを読み込んでいます");
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("未選択");
  const [previewMessage, setPreviewMessage] = useState("写真を選択するとプレビューを読み込みます");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const selectedPhoto = groupPhotos.find((photo) => photo.id === selectedPhotoId) ?? groupPhotos[0] ?? null;

  const loadGroups = useCallback(async () => {
    setLoadStatus("読み込み中");
    setActionStatus("待機中");
    setMessage("レビュー待ちグループを読み込んでいます");

    const result = await fetchPendingReviewGroups();

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
    setSelectedGroupId(result.groups[0]?.id ?? null);
    setLoadStatus(result.groups.length > 0 ? "表示中" : "データなし");
    setMessage(result.groups.length > 0 ? "レビュー待ちグループを表示しています" : "レビュー待ちグループはありません");
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

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
      provisional_patient_id: selectedGroup.provisional_patient_id ?? "",
      doctor_name: selectedGroup.doctor_name ?? "",
      photographer_name: selectedGroup.photographer_name ?? "",
      notes: selectedGroup.notes ?? ""
    });
  }, [selectedGroup]);

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

    setActionStatus("承認中");
    setMessage("グループをレビュー完了にしています");

    const result = await completeReviewGroup(selectedGroup.id);

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

  const isBusy = actionStatus === "保存中" || actionStatus === "承認中" || loadStatus === "読み込み中";

  return (
    <div className="review-layout">
      <aside className="patient-column">
        <div className="column-title">
          <h2>グループ一覧</h2>
          <span>{groups.length}件</span>
        </div>
        <div className={`review-status ${loadStatus === "取得失敗" ? "error" : ""}`}>
          <strong>{loadStatus}</strong>
          <span>{message}</span>
        </div>
        <button className="review-refresh-button" type="button" onClick={loadGroups} disabled={isBusy}>
          <RefreshCw size={16} />
          再読み込み
        </button>
        <div className="patient-list review-photo-list">
          {groups.map((group) => (
            <button
              key={group.id}
              className={selectedGroup?.id === group.id ? "patient-item active" : "patient-item"}
              onClick={() => setSelectedGroupId(group.id)}
              type="button"
            >
              <strong>{group.group_label ?? "患者候補"}</strong>
              <span>
                {group.photo_count}枚 / {group.provisional_patient_id ?? "患者ID未設定"}
              </span>
              <em>
                {group.review_status} / {formatDateTime(group.updated_at)}
              </em>
            </button>
          ))}
          {groups.length === 0 && (
            <div className="empty-result compact">
              <ClipboardCheck size={24} />
              <span>{loadStatus === "読み込み中" ? "読み込み中" : "レビュー待ちグループはありません"}</span>
            </div>
          )}
        </div>
      </aside>

      <section className="thumbnail-column">
        <div className="column-title">
          <h2>グループ内写真</h2>
          <span>{selectedGroup ? `${groupPhotos.length}枚` : "未選択"}</span>
        </div>
        {selectedGroup ? (
          <div className="review-detail">
            <div className={`preview-frame ${previewStatus === "表示中" ? "ready" : ""}`}>
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
                  <ImageIcon size={18} />
                  <strong>{getPhotoSlotLabel(index)}</strong>
                  <span>{photo.original_filename}</span>
                </button>
              ))}
              {groupPhotos.length === 0 && (
                <div className="empty-result compact">
                  <ImageIcon size={24} />
                  <span>このグループには写真がありません</span>
                </div>
              )}
            </div>
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
          <h2>グループ情報</h2>
          <span>{actionStatus}</span>
        </div>
        <form className="metadata-form">
          <label>
            provisional_patient_id
            <input
              value={form.provisional_patient_id}
              onChange={(event) => updateFormValue("provisional_patient_id", event.target.value)}
              disabled={!selectedGroup || isBusy}
              placeholder="例: P-240015"
            />
          </label>
          <label>
            doctor_name
            <input
              value={form.doctor_name}
              onChange={(event) => updateFormValue("doctor_name", event.target.value)}
              disabled={!selectedGroup || isBusy}
              placeholder="例: Dr. Nakamura"
            />
          </label>
          <label>
            photographer_name
            <input
              value={form.photographer_name}
              onChange={(event) => updateFormValue("photographer_name", event.target.value)}
              disabled={!selectedGroup || isBusy}
              placeholder="例: M. Tanaka"
            />
          </label>
          <label>
            notes
            <textarea
              value={form.notes}
              onChange={(event) => updateFormValue("notes", event.target.value)}
              disabled={!selectedGroup || isBusy}
              placeholder="確認メモ"
            />
          </label>
          <button className="primary-button approve-button" type="button" onClick={handleSave} disabled={!selectedGroup || isBusy}>
            レビュー内容を保存
          </button>
          <button className="primary-button approve-button" type="button" onClick={handleApprove} disabled={!selectedGroup || isBusy}>
            <CheckCircle2 size={18} />
            レビュー完了
          </button>
          <p className="review-action-message">{message}</p>
        </form>
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
            <dd>0.5.0 Phase 3-B</dd>
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
