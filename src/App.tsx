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
import { getSupabaseConnectionStatus } from "./lib/supabase";

type View = "dashboard" | "import" | "review" | "search" | "settings";
type ImportStatus = "未選択" | "フォルダ選択済み" | "対象ファイルなし" | "取込中" | "取込完了" | "取込失敗" | "Supabase未設定";
type SupabaseStatus = "checking" | "success" | "failed" | "not-configured";

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
          <span>Phase 2-C</span>
          <strong>Supabase dashboard stats</strong>
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

function Review() {
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);

  return (
    <div className="review-layout">
      <aside className="patient-column">
        <div className="column-title">
          <h2>患者グループ</h2>
          <span>{patients.length}件</span>
        </div>
        <div className="patient-list">
          {patients.map((patient) => (
            <button
              key={patient.id}
              className={selectedPatient.id === patient.id ? "patient-item active" : "patient-item"}
              onClick={() => setSelectedPatient(patient)}
              type="button"
            >
              <strong>{patient.name}</strong>
              <span>{patient.id}</span>
              <em>
                {patient.count}枚 / {patient.status}
              </em>
            </button>
          ))}
        </div>
      </aside>

      <section className="thumbnail-column">
        <div className="column-title">
          <h2>サムネイル</h2>
          <span>{selectedPatient.name}</span>
        </div>
        <div className="thumbnail-grid">
          {thumbnails.map((label, index) => (
            <button className={index === 0 ? "thumbnail active" : "thumbnail"} key={label} type="button">
              <div className="thumbnail-preview">
                <ImageIcon size={30} />
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className="metadata-column">
        <div className="column-title">
          <h2>メタデータ編集</h2>
          <span>仮データ</span>
        </div>
        <form className="metadata-form">
          <label>
            患者ID
            <input value={selectedPatient.id} readOnly />
          </label>
          <label>
            撮影日
            <input value={metadata.date} readOnly />
          </label>
          <label>
            担当医
            <input value={metadata.doctor} readOnly />
          </label>
          <label>
            撮影者
            <input value={metadata.photographer} readOnly />
          </label>
          <label>
            レビュー状態
            <select defaultValue={metadata.status}>
              <option>レビュー待ち</option>
              <option>確認中</option>
              <option>承認済み</option>
            </select>
          </label>
          <button className="primary-button approve-button" type="button">
            <CheckCircle2 size={18} />
            承認
          </button>
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
            <dd>0.4.0 Phase 2-D1</dd>
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
