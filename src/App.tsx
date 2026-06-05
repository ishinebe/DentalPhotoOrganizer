import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  FolderDown,
  Gauge,
  HardDriveDownload,
  Image as ImageIcon,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseConnectionStatus } from "./lib/supabase";

type View = "dashboard" | "import" | "review" | "search" | "settings";
type ImportStatus = "待機中" | "取込準備完了" | "取込中";
type SupabaseStatus = "checking" | "success" | "failed" | "not-configured";

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
          <span>Phase 2-A</span>
          <strong>Supabase connection scaffold</strong>
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

  useEffect(() => {
    let ignore = false;

    async function checkConnection() {
      const result = await getSupabaseConnectionStatus();

      if (ignore) {
        return;
      }

      setSupabaseStatus(result.status);
      setSupabaseMessage(result.message);
    }

    void checkConnection();

    return () => {
      ignore = true;
    };
  }, []);

  const cards = [
    { label: "総画像数", value: "12,480", icon: ImageIcon, hint: "保存済み写真" },
    { label: "レビュー待ち件数", value: "36", icon: ClipboardCheck, hint: "要確認グループ" },
    { label: "本日の取込件数", value: "128", icon: HardDriveDownload, hint: "2026-06-05" }
  ];

  return (
    <div className="dashboard-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="metric-card" key={card.label}>
            <div className="metric-icon">
              <Icon size={24} />
            </div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.hint}</span>
            </div>
          </article>
        );
      })}

      <SupabaseConnectionCard status={supabaseStatus} message={supabaseMessage} />

      <section className="wide-panel">
        <div>
          <h2>本日の概要</h2>
          <p>午前診療分の画像が取込済みです。レビュー待ちの患者グループを確認してください。</p>
        </div>
        <div className="status-row">
          <span className="status-dot ready" />
          <span>システム状態: 正常</span>
        </div>
      </section>
    </div>
  );
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
  const [status, setStatus] = useState<ImportStatus>("待機中");

  return (
    <div className="import-layout">
      <section className="import-panel">
        <div className="panel-heading">
          <HardDriveDownload size={24} />
          <div>
            <h2>SDカード取込</h2>
            <p>実ファイル操作なしのダミー取込画面です。</p>
          </div>
        </div>

        <div className="device-box">
          <div>
            <span>検出デバイス</span>
            <strong>SD Card Reader - Drive E:</strong>
          </div>
          <button type="button" onClick={() => setStatus("取込準備完了")}>
            接続確認
          </button>
        </div>

        <div className="import-actions">
          <button className="primary-button" type="button" onClick={() => setStatus("取込中")}>
            取込開始
          </button>
          <button type="button" onClick={() => setStatus("待機中")}>
            リセット
          </button>
        </div>
      </section>

      <aside className="status-panel">
        <h3>状態表示</h3>
        <div className="large-status">
          <span className={status === "取込中" ? "pulse-dot" : "status-dot ready"} />
          <strong>{status}</strong>
        </div>
        <ul className="process-list">
          <li>SDカード検出</li>
          <li>画像一覧取得</li>
          <li>保存先確認</li>
          <li>取込キュー作成</li>
        </ul>
      </aside>
    </div>
  );
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
            <dd>0.2.0 Phase 2-A</dd>
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
