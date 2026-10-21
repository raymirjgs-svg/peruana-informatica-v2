import {
  buildPaginationMeta,
  getSafetyLimit,
  resolvePagination,
} from '../../utils/pagination';

describe('resolvePagination', () => {
  it('uses defaults when page and limit are absent', () => {
    expect(resolvePagination({})).toEqual({
      page: 1,
      limit: 20,
      offset: 0,
      paginated: false,
    });
  });

  it('marks the response as paginated when page or limit is present', () => {
    expect(resolvePagination({ page: '2' }).paginated).toBe(true);
    expect(resolvePagination({ limit: '10' }).paginated).toBe(true);
  });

  it('parses page and limit and computes the offset', () => {
    expect(resolvePagination({ page: '3', limit: '15' })).toEqual({
      page: 3,
      limit: 15,
      offset: 30,
      paginated: true,
    });
  });

  it('falls back to page 1 for invalid or non-positive values', () => {
    expect(resolvePagination({ page: '0' }).page).toBe(1);
    expect(resolvePagination({ page: '-4' }).page).toBe(1);
    expect(resolvePagination({ page: 'abc' }).page).toBe(1);
  });

  it('clamps the limit to the maximum', () => {
    expect(resolvePagination({ limit: '5000' }, 20, 100).limit).toBe(100);
  });

  it('honours a custom default limit', () => {
    expect(resolvePagination({}, 50).limit).toBe(50);
  });
});

describe('getSafetyLimit', () => {
  it('never returns less than the safety limit', () => {
    expect(getSafetyLimit(10)).toBe(1000);
    expect(getSafetyLimit(5000)).toBe(5000);
  });
});

describe('buildPaginationMeta', () => {
  it('computes the number of pages', () => {
    expect(buildPaginationMeta(2, 10, 55)).toEqual({
      page: 2,
      limit: 10,
      total: 55,
      totalPages: 6,
    });
  });

  it('returns zero pages when there is no data', () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(0);
  });
});
