import { describe, it, expect } from 'vitest';
import kichBan from './kich-ban-han.json';

describe('Khởi tạo', () => {
  it('đọc được tệp kịch bản kiểm thử', () => {
    expect(kichBan.nhom.length).toBeGreaterThan(0);
  });
});
