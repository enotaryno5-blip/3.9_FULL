import { FormData, Owner } from '../types';

// Helper to add years to a date string YYYY-MM-DD
const addYears = (dateStr: string, years: number): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
};

// Helper to compare dates (d1 < d2)
const isBefore = (d1: string, d2: string): boolean => {
  if (!d1 || !d2) return false;
  return new Date(d1) < new Date(d2);
};

// Helper to compare dates (d1 <= d2)
const isBeforeOrEqual = (d1: string, d2: string): boolean => {
  if (!d1 || !d2) return false;
  return new Date(d1) <= new Date(d2);
};

export const getAgeExact = (birthDate: string, today: string): string => {
    if (!birthDate || !today) return "0";
    const birth = new Date(birthDate).getTime();
    const now = new Date(today).getTime();
    const diff = (now - birth) / (1000 * 60 * 60 * 24 * 365.25);
    return diff.toFixed(2);
}

export const getAgeInt = (birthDate: string, today: string): number => {
    if (!birthDate || !today) return 0;
    const birth = new Date(birthDate);
    const now = new Date(today);
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Helper to format gender - EXPORTED NOW
export const getGenderLabel = (g: string | undefined): string => {
  if (g === 'ong') return 'ông';
  if (g === 'ba') return 'bà';
  return 'ông/bà';
};

// UI Formatter
export const formatDate = (isoString: string | undefined): string => {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-');
  return `${d}/${m}/${y}`;
};

export const generateGuidance = (data: FormData): string[] => {
  const results: string[] = [];
  const today = data.guidanceDate;
  const ngay_SH = data.propertyOwnershipDate;
  let hasGuidance = false;

  // STEP_B Execution Loop
  data.owners.forEach((owner) => {
    const age = getAgeExact(owner.birthDate, today); // Using exact age for display in text if needed, but logic uses date comparison
    const birthDate = owner.birthDate;
    const sex_CSH = getGenderLabel(owner.gender); // ông/bà
    let ownerHasOutput = false;

    // Check Under 18 General Condition
    const isUnder18 = isBefore(today, addYears(birthDate, 18));

    // --- CASE: DƯỚI 18 TUỔI - CẤM TẶNG CHO ---
    // Điều kiện: Dưới 18 tuổi VÀ Loại giao dịch là Tặng cho (Option 1)
    if (isUnder18 && data.transactionType === 'tang_cho') {
        results.push(`[DƯỚI 18 TUỔI- CHO TÀI SẢN] Trẻ ${owner.name}:
                • Tính chất: TÀI SẢN RIÊNG.
                • KHÔNG THỂ TẶNG CHO TÀI SẢN CỦA CON DƯỚI 18 TUỔI`);
        ownerHasOutput = true;
        return; // Continue loop for next owner
    }
    
    // --- GROUP 1: DƯỚI 9 TUỔI (Áp dụng cho giao dịch KHÔNG PHẢI TẶNG CHO) ---
    // Điều kiện: Dưới 9 tuổi VÀ Loại giao dịch là Bán/Khác (Option 2 - implicitly handled by previous if or explicit check)
    if (isBefore(today, addYears(birthDate, 9))) {
      results.push(`[DƯỚI 9 TUỔI] Trẻ ${owner.name}:
                    • Tính chất: TÀI SẢN RIÊNG.
                    •  Người ký văn bản: Cha & Mẹ của trẻ ${owner.name},
                    → Hồ sơ xuất trình bản chính:
                            - CCCD của Cha & Mẹ trẻ ${owner.name};
                            - Giấy Khai sinh trẻ ${owner.name};
                            - GCN QSDĐ/QSH.`);
      ownerHasOutput = true;
      return; // Continue i
    }

    // --- GROUP 2: TỪ 9 TUỔI ĐẾN DƯỚI 15 TUỔI ---
    if (isBeforeOrEqual(addYears(birthDate, 9), today) && isBefore(today, addYears(birthDate, 15))) {
      results.push(`[${age} tuổi] Trẻ ${owner.name}:
                    • Tính chất: TÀI SẢN RIÊNG.
                    •  Người ký văn bản: Cha & Mẹ của trẻ ${owner.name},
                    → Phải xuất trình bản chính:
                            - CCCD của Cha & Mẹ trẻ ${owner.name};
                            - Giấy Khai sinh trẻ ${owner.name};
                            - Văn bản đồng ý của trẻ ${owner.name} (chứng nội dung)
                              HOẶC CCCD của trẻ ${owner.name} (ký chung);
                            - GCN QSDĐ/QSH.`);
      ownerHasOutput = true;
      return; // Continue i
    }

    // --- GROUP 3: TỪ 15 TUỔI ĐẾN DƯỚI 18 TUỔI ---
    if (isBeforeOrEqual(addYears(birthDate, 15), today) && isBefore(today, addYears(birthDate, 18))) {
      results.push(`[${age} tuổi] Trẻ ${owner.name}:
                    • Tính chất: TÀI SẢN RIÊNG.
                    •  Người ký văn bản: trẻ ${owner.name},
                    → Phải xuất trình bản chính:
                            - CCCD của trẻ ${owner.name};
                            - Giấy Khai sinh trẻ ${owner.name};
                            - CCCD của Cha & Mẹ (ký chung)
                              HOẶC Văn bản đồng ý của Cha Mẹ (chứng nội dung);
                            - GCN QSDĐ/QSH.`);
      ownerHasOutput = true;
      return; // Continue i
    }

    // --- GROUP 4: OVER 18 ---
    if (isBeforeOrEqual(addYears(birthDate, 18), today)) {
      
      // 4.1 — [HD18_ĐỘC THÂN//CHƯA_KH]
      const isSingleNeverMarried = owner.maritalStatus === 'doc_than' && owner.singleStatusType === 'chua_ket_hon';
      const isGiftOrInheritance = data.propertyOrigin === 'tang_cho_thua_ke';

      if (isSingleNeverMarried || isGiftOrInheritance) {
        results.push(`[ĐỘC THÂN//CHƯA_KH//GỐC TẶNG CHO//THỪA KẾ] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN RIÊNG.
                          • Người ký văn bản: ${sex_CSH} ${owner.name}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - GCN QSDĐ/QSHN.
                     Ghi chú:
                         (1) Trường hợp Tài sản có nguồn gốc thừa kế/nhân tặng cho, CẦN xuất trình:
                            * Văn bản tặng cho/Văn bản thừa kế
                         (2) Trường hợp khác, CẦN xuất trình: 
                            * Giấy xác nhận TTHN phải xác nhận đầy đủ thời gian
                              từ khi ${sex_CSH} ${owner.name} đủ tuổi kết hôn đến nay (là chưa kết hôn);
                            * Giấy xác nhận TTHN phải còn hạn 06 tháng
                              tính đến ngày nộp hồ sơ.`);
        ownerHasOutput = true;
        return; // Continue i
      }

      // 4.2 — [HD18_ĐỘC THÂN//LH→SH_TSR]
      if (owner.maritalStatus === 'doc_than' && owner.singleStatusType === 'da_ly_hon' && owner.divorceDate) {
        if (isBefore(owner.divorceDate, ngay_SH)) {
             results.push(`[ĐỘC THÂN//LH→SH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN RIÊNG.
                          • Người ký văn bản: ${sex_CSH} ${owner.name}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - Giấy xác nhận tình trạng hôn nhân của ${sex_CSH} ${owner.name};
                                - GCN QSDĐ/QSHN.
                     Ghi chú:
                         * Giấy xác nhận TTHN phải xác nhận đầy đủ thời gian
                           từ ngày ly hôn (ngày ${formatDate(owner.divorceDate)}) đến nay (là chưa kết hôn lại);
                         * Giấy xác nhận TTHN phải còn hạn 06 tháng
                           tính đến ngày nộp hồ sơ.`);
             ownerHasOutput = true;
             return; // Continue i
        }
      }

      // 4.3 — [HD18_ĐỘC THÂN//DIE→SH_TSR]
      if (owner.maritalStatus === 'doc_than' && owner.singleStatusType === 'vo_chong_chet' && owner.spouseDeathDate) {
         if (isBefore(owner.spouseDeathDate, ngay_SH)) {
            results.push(`[ĐỘC THÂN//DIE→SH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN RIÊNG.
                          • Người ký văn bản: ${sex_CSH} ${owner.name}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - Giấy xác nhận tình trạng hôn nhân của ${sex_CSH} ${owner.name};
                                - GCN QSDĐ/QSHN.
                     Ghi chú:
                         * Giấy xác nhận TTHN phải xác nhận đầy đủ thời gian
                           từ ngày vợ/chồng cũ chết (ngày ${formatDate(owner.spouseDeathDate)}) đến nay;
                         * Giấy xác nhận TTHN phải còn hạn 06 tháng
                           tính đến ngày nộp hồ sơ.`);
            ownerHasOutput = true;
            return; // Continue i
         }
      }

      // 4.4 — [HD18_ĐỘC THÂN//SH→LH_TSC]
      if (owner.maritalStatus === 'doc_than' && owner.singleStatusType === 'da_ly_hon' && owner.divorceDate) {
          if (isBeforeOrEqual(ngay_SH, owner.divorceDate)) {
              const sex_ExDivorce = getGenderLabel(owner.exSpouseGenderDivorce);
              results.push(`[ĐỘC THÂN//SH→LH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN CHUNG với ${sex_ExDivorce} ${owner.exSpouseNameDivorce}.
                          • Người ký văn bản: ${sex_CSH} ${owner.name}.
                          • Người ký cùng: ${sex_ExDivorce} ${owner.exSpouseNameDivorce}.
                          → Phải xuất trình bản chính:
                                - CCCD ${sex_CSH} ${owner.name};
                                - CCCD ${sex_ExDivorce} ${owner.exSpouseNameDivorce};
                                - Bản án ly hôn;
                                - GCN QSDĐ/QSHN.
                     Ghi chú:
                         Ông/bà vui lòng liên hệ trực tiếp nếu:
                             (1) Bản án ly hôn ĐÃ CHIA tài sản này
                                 HOẶC tài sản được tạo lập TRƯỚC thời kỳ hôn nhân;
                             (2) Bản án ly hôn không ghi rõ thời điểm kết hôn của hôn nhân ban đầu,
                                 có thể cần bổ sung trích lục kết hôn cũ.`);
              ownerHasOutput = true;
              return; // Continue i
          }
      }

      // 4.5 — [HD18_ĐỘC THÂN//SH→DIE_TSC]
      if (owner.maritalStatus === 'doc_than' && owner.singleStatusType === 'vo_chong_chet' && owner.spouseDeathDate) {
          if (isBeforeOrEqual(ngay_SH, owner.spouseDeathDate)) {
             const sex_ExDeath = getGenderLabel(owner.exSpouseGenderDeath);
             results.push(`[ĐỘC THÂN//SH→DIE] ${sex_CSH} ${owner.name}:
                          • Tính chất: CÓ KHẢ NĂNG LÀ TÀI SẢN CHUNG với ${sex_ExDeath} ${owner.exSpouseNameDeath}.
                          Do ${sex_ExDeath} ${owner.exSpouseNameDeath} đã chết,
                          → Phải thực hiện phân chia di sản thừa kế.
                          → Sau khi phân chia và đăng ký thay đổi chủ sở hữu,
                            ${sex_CSH} ${owner.name} sẽ ký chung với các thừa kế (nếu có).
                     Ghi chú:
                         Ông/bà vui lòng liên hệ trực tiếp để được hướng dẫn chi tiết,
                         đồng thời xuất trình:
                             - Giấy chứng nhận kết hôn với ${sex_ExDeath} ${owner.exSpouseNameDeath};
                             - Giấy chứng tử của ${sex_ExDeath} ${owner.exSpouseNameDeath}.`);
             ownerHasOutput = true;
             return; // Continue i
          }
      }

      // --- GROUP 5: KẾT HÔN ---
      if (owner.maritalStatus === 'co_vo_chong' && owner.marriageDate) {
          const ngayKH = owner.marriageDate;

          // [STEP-B_HD18_1_KETHON_SH_KH_TSR]
          if (owner.marriageType === 'lan_dau' && isBefore(ngay_SH, ngayKH)) {
             results.push(`[1_KẾT HÔN//SH→KH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN RIÊNG.
                          •  Người ký văn bản: ${sex_CSH} ${owner.name}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - Giấy xác nhận tình trạng hôn nhân của ${sex_CSH} ${owner.name} cho giai đoạn trước khi kết hôn;
                                - Giấy chứng nhận đăng ký kết hôn;
                                - GCN QSDĐ/QSHN.
                     Ghi chú:
                         * Giấy xác nhận TTHN phải xác nhận đủ thời gian
                           từ khi ${sex_CSH} ${owner.name} đủ tuổi kết hôn đến ngày kết hôn (ngày ${formatDate(ngayKH)});
                         * Giấy xác nhận TTHN phải còn hạn sử dụng 06 tháng
                           tính đến ngày nộp hồ sơ.`);
             ownerHasOutput = true;
             return; // Continue i
          }

          // [STEP-B_HD18_1_2_KETHON_KH_SH_TSC]
          if (isBeforeOrEqual(ngayKH, ngay_SH)) {
             const sex_Spouse = getGenderLabel(owner.currentSpouseGender);
             results.push(`[1&2_KẾT HÔN//KH→SH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN CHUNG với ${sex_Spouse} ${owner.currentSpouseName}.
                          •  Người ký văn bản: ${sex_CSH} ${owner.name}.
                          •  Người ký cùng: ${sex_Spouse} ${owner.currentSpouseName}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - CCCD của ${sex_Spouse} ${owner.currentSpouseName};
                                - Giấy chứng nhận đăng ký kết hôn;
                                - GCN QSDĐ/QSH.`);
             ownerHasOutput = true;
             return; // Continue i
          }

          // [STEP-B_HD18_2_KETHON_LY_SH_KH_TSR]
          if (owner.marriageType === 'khong_phai_lan_dau' && owner.prevMarriageEndReason === 'ly_hon' && owner.prevDivorceDate) {
              const ngayMLH = owner.prevDivorceDate;
              if (isBefore(ngayMLH, ngay_SH) && isBefore(ngay_SH, ngayKH)) {
                  results.push(`[2_KẾT HÔN//LY→SH→KH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN RIÊNG.
                          •  Người ký văn bản: ${sex_CSH} ${owner.name}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - Giấy xác nhận tình trạng hôn nhân của ${sex_CSH} ${owner.name}
                                  cho giai đoạn từ khi ly hôn (ngày ${formatDate(ngayMLH)}) cho đến ngày kết hôn lại (ngày ${formatDate(ngayKH)});
                                - Giấy chứng nhận đăng ký kết hôn;
                                - GCN QSDĐ/QSH.
                     Ghi chú:
                         * Giấy xác TTHN phải xác nhận đủ thời gian
                           cho giai đoạn từ khi ly hôn (ngày ${formatDate(ngayMLH)})
                           cho đến ngày kết hôn lại (ngày ${formatDate(ngayKH)});
                         * Giấy xác nhận TTHN phải còn hạn sử dụng 06 tháng
                           tính đến ngày nộp hồ sơ.`);
                  ownerHasOutput = true;
                  return; // Continue i
              }
          }

          // [STEP-B_HD18_2_KETHON_SH_LY_KH_TSC]
           if (owner.marriageType === 'khong_phai_lan_dau' && owner.prevMarriageEndReason === 'ly_hon' && owner.prevDivorceDate) {
              const ngayMLH = owner.prevDivorceDate;
              if (isBeforeOrEqual(ngay_SH, ngayMLH)) {
                  const sex_PrevSpouse = getGenderLabel(owner.prevSpouseGender);
                  results.push(`[2_KẾT HÔN//SH→LY→KH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN CHUNG với ${sex_PrevSpouse} ${owner.prevSpouseName}.
                          •  Người ký văn bản: ${sex_CSH} ${owner.name}.
                          •  Người ký cùng: ${sex_PrevSpouse} ${owner.prevSpouseName}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - CCCD của ${sex_PrevSpouse} ${owner.prevSpouseName};
                                - Bản án ly hôn;
                                - GCN QSDĐ/QSH.
                     Ghi chú:
                         Ông/bà vui lòng liên hệ trực tiếp để được hướng dẫn cụ thể nếu:
                             (1) Bản án ly hôn ĐÃ chia tài sản này
                                 HOẶC tài sản này có TRƯỚC thời kỳ hôn nhân với vợ/chồng cũ;
                             (2) Bản án ly hôn không ghi cụ thể thời điểm kết hôn
                                 của hôn nhân ban đầu, có thể cần bổ sung trích lục kết hôn cũ.`);
                  ownerHasOutput = true;
                  return; // Continue i
              }
          }

           // [STEP-B_HD18_2_KETHON_DIE_SH_KH_TSR]
           if (owner.marriageType === 'khong_phai_lan_dau' && owner.prevMarriageEndReason === 'chet' && owner.prevSpouseDeathDate) {
              const ngayChet = owner.prevSpouseDeathDate;
              if (isBefore(ngayChet, ngay_SH) && isBefore(ngay_SH, ngayKH)) {
                  results.push(`[2_KẾT HÔN//DIE→SH→KH] ${sex_CSH} ${owner.name}:
                          • Tính chất: TÀI SẢN RIÊNG.
                          •  Người ký văn bản: ${sex_CSH} ${owner.name}.
                          → Phải xuất trình bản chính:
                                - CCCD của ${sex_CSH} ${owner.name};
                                - Giấy xác nhận tình trạng hôn nhân của ${sex_CSH} ${owner.name}
                                  cho giai đoạn từ khi vợ/chồng chết (ngày ${formatDate(ngayChet)})
                                  cho đến ngày kết hôn lại (ngày ${formatDate(ngayKH)});
                                - Giấy chứng nhận đăng ký kết hôn;
                                - GCN QSDĐ/QSHN.
                     Ghi chú:
                         * Giấy xác nhận TTHN phải xác nhận đủ thời gian
                           cho giai đoạn từ khi vợ/chồng chết (ngày ${formatDate(ngayChet)})
                           cho đến ngày kết hôn lại (ngày ${formatDate(ngayKH)});
                         * Giấy xác nhận TTHN phải còn hạn sử dụng 06 tháng
                           tính đến ngày nộp hồ sơ.`);
                  ownerHasOutput = true;
                  return; // Continue i
              }
           }

           // [STEP-B_HD18_2_KETHON_SH_DIE_KH_TSC]
           if (owner.marriageType === 'khong_phai_lan_dau' && owner.prevMarriageEndReason === 'chet' && owner.prevSpouseDeathDate) {
              const ngayChet = owner.prevSpouseDeathDate;
              if (isBeforeOrEqual(ngay_SH, ngayChet)) {
                  const sex_PrevSpouse = getGenderLabel(owner.prevSpouseGender);
                  results.push(`[2_KẾT HÔN//SH→DIE→KH] ${sex_CSH} ${owner.name}:
                          • Tính chất: KHẢ NĂNG TÀI SẢN CHUNG với ${sex_PrevSpouse} ${owner.prevSpouseName}.
                          Do ${sex_PrevSpouse} ${owner.prevSpouseName} đã chết,
                          → Phải phân chia đối với di sản thừa kế của ${sex_PrevSpouse} ${owner.prevSpouseName}.
                          → Sau khi phân chia di sản và đăng ký thay đổi chủ sở hữu,
                            ${sex_CSH} ${owner.name} sẽ ký chung với những người thừa kế (nếu có).
                     Ghi chú:
                         Ông/bà vui lòng liên hệ trực tiếp để được hướng dẫn cụ thể,
                         đồng thời xuất trình:
                             - Giấy chứng nhận kết hôn với ${sex_PrevSpouse} ${owner.prevSpouseName};
                             - Giấy chứng tử của ${sex_PrevSpouse} ${owner.prevSpouseName}.`);
                  ownerHasOutput = true;
                  return; // Continue i
              }
           }
      }
    }
    
    // Fallback if no guidance generated for this owner
    if (!ownerHasOutput) {
       results.push(`[CẢNH BÁO] Không tìm thấy kịch bản phù hợp cho ${sex_CSH} ${owner.name}.
       Vui lòng kiểm tra lại ngày tháng năm sinh hoặc ngày sở hữu tài sản so với các mốc sự kiện (kết hôn, ly hôn, tuất).`);
    } else {
       hasGuidance = true;
    }
  });

  // [MODULE_PL#_KHAC]
  if (data.isMortgaged === 'dang_the_chap') {
    results.push(`[PL#_1: GIAICHAP]
      • Cần bổ sung Văn bản giải chấp của bên Nhận thế chấp.
      → Liên hệ với Ngân hàng để có Văn bản giải chấp (sau khi trả hết nợ).`);
  }

  if (data.isSecured === 'co') {
    results.push(`[PL#_2: XOA_GDBĐ]
      • CÓ THỂ theo yêu cầu của một số Văn phòng đăng ký đất đai
        thì PHẢI TIẾN HÀNH XOÁ ĐĂNG KÝ GIAO DỊCH BẢO ĐẢM
        MỚI ĐƯỢC THỰC HIỆN GIAO DỊCH.
      → Liên hệ với VPĐK ĐẤT ĐAI để xoá đăng ký GDBĐ trên GCN QSDĐ/QSHN.`);
  }

  if (data.hasFinancialDebt === 'co') {
    results.push(`[PL#_3: NO_TSDĐ]
      • Hiện tại CHƯA THỂ thực hiện được giao dịch.
        Lý do: vẫn còn đang nợ nghĩa vụ tài chính.
      → Liên hệ với Cơ quan thuế để hoàn tất nghĩa vụ tài chính;
      → Liên hệ với VPĐK ĐẤT ĐAI để đăng ký xoá ghi nợ trên GCN QSDĐ/QSHN.`);
  }

  return results;
};

// Generate Text Report (Fallback)
export const generateReportText = (data: FormData, results: string[]): string => {
  const line = "--------------------------------------------------";
  let content = `PHÒNG CÔNG CHỨNG SỐ 5\nPHIẾU HƯỚNG DẪN HỒ SƠ BAN ĐẦU (CÁ NHÂN)\n\n`;
  content += `Ngày hướng dẫn: ${formatDate(data.guidanceDate)}\n`;
  content += `${line}\nI. THÔNG TIN KÊ KHAI\n${line}\n`;

  // General Info
  content += `1. Loại giao dịch: ${data.transactionType === 'tang_cho' ? 'Tặng cho' : 'Bán/Chuyển nhượng/Góp vốn/Thế chấp'}\n`;
  content += `2. Giấy chứng nhận: ${data.hasCertificate === 'co' ? 'Đã có' : 'Chưa có'}\n`;
  
  if (data.hasCertificate === 'co') {
    content += `3. Nguồn gốc tài sản: `;
    if (data.propertyOrigin === 'nhan_chuyen_nhuong') content += 'Mua/Nhận chuyển nhượng...';
    else if (data.propertyOrigin === 'tang_cho_thua_ke') content += 'Được tặng cho/Thừa kế';
    else content += 'Trực tiếp được NN công nhận';
    content += `\n4. Ngày sở hữu: ${formatDate(data.propertyOwnershipDate)}\n`;
    content += `5. Thế chấp: ${data.isMortgaged === 'dang_the_chap' ? 'Đang thế chấp' : data.isMortgaged === 'da_giai_chap' ? 'Đã giải chấp' : 'Không'}\n`;
    
    // Owners
    content += `\n6. Danh sách chủ sở hữu (${data.numberOfOwners} người):\n`;
    data.owners.forEach((o, i) => {
      content += `  - CSH ${i + 1}: ${getGenderLabel(o.gender)} ${o.name} (Sinh: ${formatDate(o.birthDate)})\n`;
      content += `    + Tình trạng: ${o.maritalStatus === 'doc_than' ? 'Độc thân' : 'Đang có vợ/chồng'}\n`;
      
      if (o.maritalStatus === 'doc_than') {
           let singleType = '';
           if (o.singleStatusType === 'chua_ket_hon') {
               singleType = 'Chưa kết hôn lần nào';
               content += `    + Chi tiết: ${singleType}\n`;
           }
           else if (o.singleStatusType === 'da_ly_hon') {
               singleType = 'Đã ly hôn';
               content += `    + Chi tiết: ${singleType}\n`;
               if (o.divorceDate) content += `    + Ngày ly hôn: ${formatDate(o.divorceDate)}\n`;
               if (o.exSpouseNameDivorce) content += `    + Vợ/chồng cũ (Ly hôn): ${getGenderLabel(o.exSpouseGenderDivorce)} ${o.exSpouseNameDivorce}\n`;
           }
           else if (o.singleStatusType === 'vo_chong_chet') {
               singleType = 'Vợ/chồng đã chết';
               content += `    + Chi tiết: ${singleType}\n`;
               if (o.spouseDeathDate) content += `    + Ngày vợ/chồng chết: ${formatDate(o.spouseDeathDate)}\n`;
               if (o.exSpouseNameDeath) content += `    + Vợ/chồng cũ (Đã mất): ${getGenderLabel(o.exSpouseGenderDeath)} ${o.exSpouseNameDeath}\n`;
           }
      }

      if (o.maritalStatus === 'co_vo_chong') {
         content += `    + Ngày ĐK kết hôn: ${formatDate(o.marriageDate)}\n`;
         content += `    + Vợ/chồng hiện tại: ${getGenderLabel(o.currentSpouseGender)} ${o.currentSpouseName || 'N/A'}\n`;
         content += `    + Loại kết hôn: ${o.marriageType === 'lan_dau' ? 'Lần đầu' : 'Không phải lần đầu'}\n`;
         
         if (o.marriageType === 'khong_phai_lan_dau') {
             if (o.prevMarriageEndReason === 'ly_hon') {
                 content += `    + Lý do chấm dứt lần trước: Ly hôn\n`;
                 if (o.prevDivorceDate) content += `    + Ngày ly hôn trước: ${formatDate(o.prevDivorceDate)}\n`;
                 if (o.prevSpouseName) content += `    + Vợ/chồng trước: ${getGenderLabel(o.prevSpouseGender)} ${o.prevSpouseName}\n`;
             } else if (o.prevMarriageEndReason === 'chet') {
                 content += `    + Lý do chấm dứt lần trước: Vợ/chồng chết\n`;
                 if (o.prevSpouseDeathDate) content += `    + Ngày vợ/chồng trước chết: ${formatDate(o.prevSpouseDeathDate)}\n`;
                 if (o.prevSpouseName) content += `    + Vợ/chồng trước: ${getGenderLabel(o.prevSpouseGender)} ${o.prevSpouseName}\n`;
             }
         }
      }
    });
  }

  // Results
  content += `\n${line}\nII. KẾT QUẢ HƯỚNG DẪN\n${line}\n\n`;
  if (results.length === 0) {
    content += "Không có hướng dẫn cụ thể.\n";
  } else {
    results.forEach((res, idx) => {
      content += `[MỤC ${idx + 1}]\n${res}\n\n`;
    });
  }

  // Footer
  content += `${line}\n[GHI CHÚ QUAN TRỌNG]\nNội dung hướng dẫn nêu trên chỉ mang TÍNH CHẤT THAM KHẢO dựa trên dữ liệu Quý khách cung cấp.\nQuý khách vui lòng liên hệ trực tiếp cán bộ nghiệp vụ để được hướng dẫn chi tiết.\n`;
  content += `PHIÊN BẢN HƯỚNG DẪN HỒ SƠ CÔNG CHỨNG CỦA PHÒNG CÔNG CHỨNG SỐ 5 - PHIÊN BẢN 3.9.\n`;

  return content;
};