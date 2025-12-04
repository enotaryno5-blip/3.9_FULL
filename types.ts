
export type Gender = 'ong' | 'ba';

export interface Owner {
  id: number;
  name: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  
  // Marital Status (A2-0)
  maritalStatus?: 'doc_than' | 'co_vo_chong';
  
  // Single Path (A2-1)
  singleStatusType?: 'chua_ket_hon' | 'da_ly_hon' | 'vo_chong_chet';
  divorceDate?: string; // A2-1.2
  exSpouseNameDivorce?: string;
  exSpouseGenderDivorce?: Gender;
  
  spouseDeathDate?: string; // A2-1.3
  exSpouseNameDeath?: string;
  exSpouseGenderDeath?: Gender;

  // Married Path (A2-2)
  marriageDate?: string; // A2-2.0
  currentSpouseName?: string;
  currentSpouseGender?: Gender;
  
  marriageType?: 'lan_dau' | 'khong_phai_lan_dau'; // A2-2.1
  prevMarriageEndReason?: 'ly_hon' | 'chet'; // A2-2.2
  prevDivorceDate?: string; // A2-2.2.1
  prevSpouseDeathDate?: string; // A2-2.2.2
  prevSpouseName?: string; // A2-2.3
  prevSpouseGender?: Gender;
}

export interface FormData {
  // A0
  guidanceDate: string; // YYYY-MM-DD
  
  // A01
  transactionType: 'tang_cho' | 'mua_ban_khac';
  
  // A1-1
  hasCertificate: 'co' | 'khong';
  
  // A1-2
  numberOfOwners: number | string;
  owners: Owner[];
  
  // A1-3
  propertyOrigin: 'nhan_chuyen_nhuong' | 'tang_cho_thua_ke' | 'nha_nuoc_cong_nhan';
  propertyOwnershipDate: string; // YYYY-MM-DD
  
  // A1-4
  isMortgaged: 'dang_the_chap' | 'da_giai_chap' | 'khong_the_chap';
  isSecured: 'co' | 'khong';
  hasFinancialDebt: 'co' | 'khong';
}

export const initialOwner: Owner = {
  id: 0,
  name: '',
  gender: 'ong',
  birthDate: '',
};

export const initialFormData: FormData = {
  guidanceDate: new Date().toISOString().split('T')[0],
  transactionType: 'mua_ban_khac',
  hasCertificate: 'co',
  numberOfOwners: 1,
  owners: [{ ...initialOwner, id: 1 }],
  propertyOrigin: 'nhan_chuyen_nhuong',
  propertyOwnershipDate: '',
  isMortgaged: 'khong_the_chap',
  isSecured: 'khong',
  hasFinancialDebt: 'khong',
};
