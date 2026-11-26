// Màn Cài đặt (UI §4.13): hồ sơ, quy tắc, nhắc việc, bảo mật, giao diện, sao lưu.
import { Tabs } from '../thanhPhan';
import { diDen, route } from '../store';
import { CaiDatQuyTac } from './caiDatQuyTac';
import { CaiDatHoSo } from './caiDatHoSo';
import { CaiDatNhacViec, CaiDatGiaoDien } from './caiDatNhac';
import { CaiDatBaoMat } from './caiDatBaoMat';
import { CaiDatSaoLuu } from './caiDatSaoLuu';

const MUC = [
  { ma: 'ho-so', ten: 'Hồ sơ' },
  { ma: 'quy-tac', ten: 'Quy tắc thời hạn' },
  { ma: 'nhac-viec', ten: 'Nhắc việc' },
  { ma: 'bao-mat', ten: 'Bảo mật' },
  { ma: 'giao-dien', ten: 'Giao diện' },
  { ma: 'sao-luu', ten: 'Sao lưu & dữ liệu' },
] as const;
type MaMuc = (typeof MUC)[number]['ma'];

export function ManCaiDat() {
  const r = route.value;
  const muc = (MUC.find((m) => m.ma === (r.man === 'cai-dat' ? r.muc : undefined))?.ma ?? 'ho-so') as MaMuc;
  return (
    <div class="trang-cai-dat">
      <Tabs nhan="Nhóm cài đặt" cac={MUC.map((m) => ({ ma: m.ma, ten: m.ten }))} dang={muc} doi={(m) => diDen(`#cai-dat/${m}`)} />
      {muc === 'ho-so' && <CaiDatHoSo />}
      {muc === 'quy-tac' && <CaiDatQuyTac />}
      {muc === 'nhac-viec' && <CaiDatNhacViec />}
      {muc === 'bao-mat' && <CaiDatBaoMat />}
      {muc === 'giao-dien' && <CaiDatGiaoDien />}
      {muc === 'sao-luu' && <CaiDatSaoLuu />}
    </div>
  );
}
