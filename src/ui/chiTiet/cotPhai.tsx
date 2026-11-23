import { TrangThaiRong } from '../thanhPhan';

/** Cột phải của màn Chi tiết cuộc: dòng thời gian mốc – hoàn thiện ở T22. */
export function CotPhaiChiTiet({ id }: { id: string }) {
  return <TrangThaiRong tieuDe="Dòng thời gian mốc" moTa={`Cuộc ${id}`} />;
}
