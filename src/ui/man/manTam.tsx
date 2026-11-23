import { TrangThaiRong } from '../thanhPhan';

/** Màn chưa xây – sẽ được thay lần lượt theo T19–T32. */
export function ManTam({ ten }: { ten: string }) {
  return <TrangThaiRong tieuDe={ten} moTa="Màn hình này đang được xây dựng." />;
}
