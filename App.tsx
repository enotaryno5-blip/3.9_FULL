
import React, { useState } from 'react';
import { FormData, initialFormData, initialOwner, Owner, Gender } from './types';
import { generateGuidance, formatDate, getAgeExact, generateReportText, getGenderLabel } from './services/logic';
import { ScrollText, User, Home, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Download } from 'lucide-react';

// Reusable Components
const Label = ({ children, required }: { children?: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-slate-700 mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

type InputProps = React.ComponentPropsWithoutRef<'input'> & {
  error?: string;
};

const Input = ({ error, className, ...props }: InputProps) => (
  <div className="w-full">
    <input
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
        error 
          ? 'border-red-500 focus:ring-red-200 bg-red-50' 
          : 'border-slate-300 focus:ring-blue-500'
      } ${className || ''}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

type SelectProps = React.ComponentPropsWithoutRef<'select'> & {
  error?: string;
};

const Select = ({ children, error, ...props }: SelectProps) => (
  <div className="w-full">
    <select
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors bg-white ${
        error 
          ? 'border-red-500 focus:ring-red-200 bg-red-50' 
          : 'border-slate-300 focus:ring-blue-500'
      }`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const RadioGroup = ({ label, name, options, value, onChange, error }: { 
  label: string, 
  name: string, 
  options: { value: string, label: string }[], 
  value: string | undefined, 
  onChange: (val: string) => void,
  error?: string
}) => (
  <div className={`mb-4 ${error ? 'p-3 border border-red-200 rounded bg-red-50' : ''}`}>
    <Label required>{label}</Label>
    <div className="flex flex-col space-y-2 mt-2">
      {options.map((opt) => (
        <label key={opt.value} className="inline-flex items-center">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            className="form-radio text-blue-600 h-4 w-4"
          />
          <span className="ml-2 text-slate-700">{opt.label}</span>
        </label>
      ))}
    </div>
    {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
  </div>
);

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [results, setResults] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update root form data
  const updateData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Update specific owner data
  const updateOwner = (index: number, field: keyof Owner, value: any) => {
    const newOwners = [...formData.owners];
    newOwners[index] = { ...newOwners[index], [field]: value };
    setFormData(prev => ({ ...prev, owners: newOwners }));
    
    // Clear error
    const errorKey = `${field}`; // Using simple keys since we validate per step
    if (errors[errorKey]) {
        setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // VALIDATION LOGIC
  const validateCurrentStep = (): Record<string, string> => {
      const newErrors: Record<string, string> = {};

      // Step 0
      if (step === 0) {
        if (!formData.guidanceDate) newErrors['guidanceDate'] = "Vui lòng nhập Ngày hướng dẫn";
        if (!formData.transactionType) newErrors['transactionType'] = "Vui lòng chọn Loại giao dịch";
      }
      // Step 1
      if (step === 1) {
        if (!formData.hasCertificate) newErrors['hasCertificate'] = "Vui lòng chọn tình trạng Giấy chứng nhận";
      }
      // Step 2
      if (step === 2) {
        if (!formData.numberOfOwners || Number(formData.numberOfOwners) < 1) newErrors['numberOfOwners'] = "Số lượng chủ sở hữu phải ít nhất là 1";
        if (!formData.propertyOrigin) newErrors['propertyOrigin'] = "Vui lòng chọn Nguồn gốc tài sản";
        if (!formData.propertyOwnershipDate) newErrors['propertyOwnershipDate'] = "Vui lòng nhập Ngày bắt đầu sở hữu";
        if (!formData.isMortgaged) newErrors['isMortgaged'] = "Vui lòng chọn Tình trạng thế chấp";
        if (!formData.isSecured) newErrors['isSecured'] = "Vui lòng chọn Tình trạng đăng ký giao dịch bảo đảm";
        if (!formData.hasFinancialDebt) newErrors['hasFinancialDebt'] = "Vui lòng chọn Tình trạng nợ nghĩa vụ tài chính";
      }
      // Owner Details Steps
      if (step > 2) {
        const index = step - 3;
        const owner = formData.owners[index];
        const pDate = new Date(formData.propertyOwnershipDate);

        if (!owner.name) newErrors['name'] = "Vui lòng nhập Họ tên chủ sở hữu";
        if (!owner.birthDate) newErrors['birthDate'] = "Vui lòng nhập Ngày sinh chủ sở hữu";
        if (!owner.gender) newErrors['gender'] = "Vui lòng chọn Cách xưng hô";
        if (!owner.maritalStatus) newErrors['maritalStatus'] = "Vui lòng chọn Tình trạng hôn nhân";

        if (owner.maritalStatus === 'doc_than') {
            if (!owner.singleStatusType) newErrors['singleStatusType'] = "Vui lòng chọn chi tiết tình trạng độc thân";
            
            if (owner.singleStatusType === 'da_ly_hon') {
                if (!owner.divorceDate) newErrors['divorceDate'] = "Vui lòng nhập Ngày ly hôn";
                const dDate = new Date(owner.divorceDate);
                // Condition: Property Date <= Divorce Date -> Need Ex Spouse Info
                if (formData.propertyOwnershipDate && pDate <= dDate) {
                    if (!owner.exSpouseNameDivorce) newErrors['exSpouseNameDivorce'] = "Vui lòng nhập Họ tên vợ/chồng cũ";
                    if (!owner.exSpouseGenderDivorce) newErrors['exSpouseGenderDivorce'] = "Vui lòng chọn Xưng hô vợ/chồng cũ";
                }
            }
            if (owner.singleStatusType === 'vo_chong_chet') {
                if (!owner.spouseDeathDate) newErrors['spouseDeathDate'] = "Vui lòng nhập Ngày vợ/chồng chết";
                const dDate = new Date(owner.spouseDeathDate);
                // Condition: Property Date <= Death Date -> Need Ex Spouse Info
                if (formData.propertyOwnershipDate && pDate <= dDate) {
                     if (!owner.exSpouseNameDeath) newErrors['exSpouseNameDeath'] = "Vui lòng nhập Họ tên vợ/chồng đã mất";
                     if (!owner.exSpouseGenderDeath) newErrors['exSpouseGenderDeath'] = "Vui lòng chọn Xưng hô vợ/chồng đã mất";
                }
            }
        }

        if (owner.maritalStatus === 'co_vo_chong') {
             if (!owner.marriageDate) newErrors['marriageDate'] = "Vui lòng nhập Ngày đăng ký kết hôn";
             const mDate = new Date(owner.marriageDate);
             
             // Condition: Marriage Date <= Property Date -> Need Current Spouse Info
             if (formData.propertyOwnershipDate && mDate <= pDate) {
                 if (!owner.currentSpouseName) newErrors['currentSpouseName'] = "Vui lòng nhập Họ tên vợ/chồng hiện tại";
                 if (!owner.currentSpouseGender) newErrors['currentSpouseGender'] = "Vui lòng chọn Xưng hô vợ/chồng hiện tại";
             }

             if (!owner.marriageType) newErrors['marriageType'] = "Vui lòng chọn Chi tiết kết hôn";

             if (owner.marriageType === 'khong_phai_lan_dau') {
                 if (!owner.prevMarriageEndReason) newErrors['prevMarriageEndReason'] = "Vui lòng chọn Lý do chấm dứt hôn nhân trước";
                 
                 if (owner.prevMarriageEndReason === 'ly_hon') {
                     if (!owner.prevDivorceDate) newErrors['prevDivorceDate'] = "Vui lòng nhập Ngày ly hôn trước đây";
                     const pdDate = new Date(owner.prevDivorceDate);
                     // Condition: Property <= Prev Divorce
                     if (formData.propertyOwnershipDate && pDate <= pdDate) {
                          if (!owner.prevSpouseName) newErrors['prevSpouseName'] = "Vui lòng nhập Họ tên vợ/chồng trước đây";
                          if (!owner.prevSpouseGender) newErrors['prevSpouseGender'] = "Vui lòng chọn Xưng hô vợ/chồng trước đây";
                     }
                 }
                 if (owner.prevMarriageEndReason === 'chet') {
                     if (!owner.prevSpouseDeathDate) newErrors['prevSpouseDeathDate'] = "Vui lòng nhập Ngày vợ/chồng trước chết";
                     const pdDate = new Date(owner.prevSpouseDeathDate);
                     // Condition: Property <= Prev Death
                     if (formData.propertyOwnershipDate && pDate <= pdDate) {
                          if (!owner.prevSpouseName) newErrors['prevSpouseName'] = "Vui lòng nhập Họ tên vợ/chồng trước đây";
                          if (!owner.prevSpouseGender) newErrors['prevSpouseGender'] = "Vui lòng chọn Xưng hô vợ/chồng trước đây";
                     }
                 }
             }
        }
      }
      return newErrors;
  };

  const handleContinue = () => {
    // 1. Validate
    const currentErrors = validateCurrentStep();
    if (Object.keys(currentErrors).length > 0) {
        setErrors(currentErrors);
        // Scroll to top of form to see errors
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
    }
    setErrors({}); // Clear errors if valid

    // 2. Logic Step 1
    if (step === 1 && formData.hasCertificate === 'khong') {
       // Stop flow and show result
       setResults(["[Hướng dẫn]: HS KHÔNG ĐỦ ĐIỀU KIỆN ĐỂ CÔNG CHỨNG"]);
       setCompleted(true);
       return;
    }
    
    // 3. Logic Step 2 (Initialize owners)
    if (step === 2) {
      const currentCount = formData.owners.length;
      const targetCount = Number(formData.numberOfOwners) || 1;
      if (targetCount !== currentCount) {
        const newOwners = [...formData.owners];
        if (targetCount > currentCount) {
          for (let i = currentCount; i < targetCount; i++) {
            newOwners.push({ ...initialOwner, id: i + 1 });
          }
        } else {
          newOwners.splice(targetCount);
        }
        setFormData(prev => ({ ...prev, owners: newOwners }));
      }
    }

    // 4. Check if finish
    if (step === 2 + formData.owners.length) {
        handleFinish();
    } else {
        setStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
      setStep(prev => prev - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = () => {
    const generated = generateGuidance(formData);
    setResults(generated);
    setCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetApp = () => {
    setFormData(initialFormData);
    setStep(0);
    setCompleted(false);
    setResults([]);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadReport = () => {
      // Create an HTML document string that Word can open
      let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
           <meta charset='utf-8'>
           <title>Phiếu Hướng Dẫn</title>
           <style>
             body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; }
             h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 20px; }
             h2 { font-size: 14pt; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #000; padding-bottom: 5px; }
             .owner-block { margin-bottom: 15px; }
             .result-block { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9; }
             .footer { margin-top: 30px; font-style: italic; font-size: 12pt; border-top: 1px solid #ccc; padding-top: 10px; }
           </style>
        </head>
        <body>
            <h1>PHÒNG CÔNG CHỨNG SỐ 5<br/>HỆ THỐNG HƯỚNG DẪN HỒ SƠ BAN ĐẦU</h1>
            <p style="text-align:center">Ngày hướng dẫn: ${formatDate(formData.guidanceDate)}</p>
            
            <h2>I. THÔNG TIN KÊ KHAI</h2>
            <p><strong>1. Loại giao dịch:</strong> ${formData.transactionType === 'tang_cho' ? 'Tặng cho' : 'Bán/Chuyển nhượng/Góp vốn/Thế chấp'}</p>
            <p><strong>2. Giấy chứng nhận:</strong> ${formData.hasCertificate === 'co' ? 'Đã có' : 'Chưa có'}</p>
            
            ${formData.hasCertificate === 'co' ? `
            <p><strong>3. Nguồn gốc tài sản:</strong> ${formData.propertyOrigin === 'nhan_chuyen_nhuong' ? 'Mua/Nhận chuyển nhượng' : formData.propertyOrigin === 'tang_cho_thua_ke' ? 'Tặng cho/Thừa kế' : 'NN công nhận'}</p>
            <p><strong>4. Ngày sở hữu:</strong> ${formatDate(formData.propertyOwnershipDate)}</p>
            <p><strong>5. Thế chấp:</strong> ${formData.isMortgaged === 'dang_the_chap' ? 'Đang thế chấp' : formData.isMortgaged === 'da_giai_chap' ? 'Đã giải chấp' : 'Không'}</p>
            
            <h3>Danh sách chủ sở hữu:</h3>
            ${formData.owners.map((o, i) => `
               <div class="owner-block">
                  <strong>${i + 1}. ${getGenderLabel(o.gender)} ${o.name}</strong> (Sinh: ${formatDate(o.birthDate)})<br/>
                  - Tình trạng: ${o.maritalStatus === 'doc_than' ? 'Độc thân' : 'Đang có vợ/chồng'}<br/>
                  
                  ${o.maritalStatus === 'doc_than' ? `
                      - Chi tiết: ${o.singleStatusType === 'chua_ket_hon' ? 'Chưa kết hôn' : o.singleStatusType === 'da_ly_hon' ? 'Đã ly hôn' : 'Vợ/chồng đã chết'}<br/>
                      
                      ${o.singleStatusType === 'da_ly_hon' ? `
                         ${o.divorceDate ? `- Ngày ly hôn: ${formatDate(o.divorceDate)}<br/>` : ''}
                         ${o.exSpouseNameDivorce ? `- Vợ/chồng cũ (Ly hôn): ${getGenderLabel(o.exSpouseGenderDivorce)} ${o.exSpouseNameDivorce}<br/>` : ''}
                      ` : ''}

                      ${o.singleStatusType === 'vo_chong_chet' ? `
                         ${o.spouseDeathDate ? `- Ngày vợ/chồng chết: ${formatDate(o.spouseDeathDate)}<br/>` : ''}
                         ${o.exSpouseNameDeath ? `- Vợ/chồng cũ (Đã mất): ${getGenderLabel(o.exSpouseGenderDeath)} ${o.exSpouseNameDeath}<br/>` : ''}
                      ` : ''}

                  ` : ''}

                  ${o.maritalStatus === 'co_vo_chong' ? `
                      - Ngày đăng ký kết hôn: ${formatDate(o.marriageDate)}<br/>
                      - Vợ/chồng hiện tại: ${getGenderLabel(o.currentSpouseGender)} ${o.currentSpouseName || 'N/A'}<br/>
                      - Loại kết hôn: ${o.marriageType === 'lan_dau' ? 'Lần đầu' : 'Không phải lần đầu'}<br/>
                      ${o.marriageType === 'khong_phai_lan_dau' ? `
                         - Lý do chấm dứt lần trước: ${o.prevMarriageEndReason === 'ly_hon' ? 'Ly hôn' : 'Vợ/chồng chết'}<br/>
                         
                         ${o.prevMarriageEndReason === 'ly_hon' ? `
                            ${o.prevDivorceDate ? `- Ngày ly hôn trước: ${formatDate(o.prevDivorceDate)}<br/>` : ''}
                            ${o.prevSpouseName ? `- Vợ/chồng trước: ${getGenderLabel(o.prevSpouseGender)} ${o.prevSpouseName}<br/>` : ''}
                         `: ''}

                         ${o.prevMarriageEndReason === 'chet' ? `
                            ${o.prevSpouseDeathDate ? `- Ngày vợ/chồng trước chết: ${formatDate(o.prevSpouseDeathDate)}<br/>` : ''}
                            ${o.prevSpouseName ? `- Vợ/chồng trước: ${getGenderLabel(o.prevSpouseGender)} ${o.prevSpouseName}<br/>` : ''}
                         `: ''}

                      ` : ''}
                  ` : ''}
               </div>
            `).join('')}
            ` : ''}

            <h2>II. KẾT QUẢ HƯỚNG DẪN</h2>
            ${results.map((res, i) => `
                <div class="result-block">
                    ${res.replace(/\n/g, '<br/>')}
                </div>
            `).join('')}

            <div class="footer">
                <p><strong>[GHI CHÚ]</strong> Nội dung hướng dẫn nêu trên chỉ mang TÍNH CHẤT THAM KHẢO (dựa trên dữ liệu do Quý khách cung cấp).</p>
                <p>Quý khách vui lòng liên hệ trực tiếp, xuất trình giấy tờ cụ thể để được hướng dẫn, giải quyết theo quy định.</p>
            </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word.document.12' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Phieu_Huong_Dan_${formData.guidanceDate}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- RENDER STEPS ---

  const renderStep0 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
         <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <ScrollText size={20}/> Thông tin chung
         </h2>
      </div>
      <div>
        <Label required>Ngày hướng dẫn (Hôm nay)</Label>
        <Input 
          type="date" 
          value={formData.guidanceDate} 
          onChange={(e) => updateData('guidanceDate', e.target.value)}
          error={errors['guidanceDate']}
        />
      </div>
      <RadioGroup
        label="Loại giao dịch dự định thực hiện?"
        name="transactionType"
        value={formData.transactionType}
        onChange={(v) => updateData('transactionType', v)}
        options={[
          { value: 'tang_cho', label: 'Tặng cho' },
          { value: 'mua_ban_khac', label: 'Bán / Chuyển nhượng / Góp vốn / Thế chấp' }
        ]}
        error={errors['transactionType']}
      />
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
         <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <Home size={20}/> Tình trạng Giấy chứng nhận
         </h2>
      </div>
      <RadioGroup
        label="Nhà/đất đã có Giấy chứng nhận QSDĐ/QSHN chưa?"
        name="hasCertificate"
        value={formData.hasCertificate}
        onChange={(v) => updateData('hasCertificate', v)}
        options={[
          { value: 'co', label: 'Có' },
          { value: 'khong', label: 'Không có' }
        ]}
        error={errors['hasCertificate']}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
         <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <User size={20}/> Thông tin Chủ sở hữu & Nguồn gốc
         </h2>
      </div>
      
      <div>
        <Label required>Số lượng chủ sở hữu (Người đứng tên trên GCN)</Label>
        <Input 
          type="number" 
          min={1} 
          value={formData.numberOfOwners} 
          onChange={(e) => updateData('numberOfOwners', e.target.value === '' ? '' : parseInt(e.target.value))} 
          error={errors['numberOfOwners']}
        />
      </div>

      <div className="pt-4 border-t border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Nguồn gốc & Tình trạng tài sản</h3>
        
        <RadioGroup
          label="Tài sản có được từ giao dịch nào?"
          name="propertyOrigin"
          value={formData.propertyOrigin}
          onChange={(v) => updateData('propertyOrigin', v)}
          options={[
            { value: 'nhan_chuyen_nhuong', label: 'Mua / Nhận chuyển nhượng / Góp vốn / Thuê đất' },
            { value: 'tang_cho_thua_ke', label: 'Được tặng cho / Thừa kế' },
            { value: 'nha_nuoc_cong_nhan', label: 'TRỰC TIẾP được nhà nước công nhận QSDĐ' }
          ]}
          error={errors['propertyOrigin']}
        />

        <div className="mb-4">
          <Label required>Ngày BẮT ĐẦU SỞ HỮU tài sản?</Label>
          <Input 
            type="date" 
            value={formData.propertyOwnershipDate} 
            onChange={(e) => updateData('propertyOwnershipDate', e.target.value)} 
            error={errors['propertyOwnershipDate']}
          />
          <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-200">
             <p className="font-semibold mb-1">Lưu ý ghi ngày:</p>
             <ul className="list-disc list-inside space-y-1">
                 <li>Nếu sở hữu do nhận chuyển quyền: Ghi theo ngày Đăng ký THAY ĐỔI CHỦ SỞ HỮU được ghi trên GCN.</li>
                 <li>Nếu TRỰC TIẾP ĐƯỢC nhà nước công nhận QSDĐ: KHÔNG ghi ngày cấp GCN. Ghi ngày TẠO DỰNG TÀI SẢN TRƯỚC ĐÂY.</li>
                 <li>Các trường hợp còn lại: Ghi theo ngày cấp GCN QSDĐ.</li>
             </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioGroup
            label="Tình trạng thế chấp?"
            name="isMortgaged"
            value={formData.isMortgaged}
            onChange={(v) => updateData('isMortgaged', v)}
            options={[
                { value: 'dang_the_chap', label: 'Đang thế chấp' },
                { value: 'da_giai_chap', label: 'Đã giải chấp' },
                { value: 'khong_the_chap', label: 'Không thế chấp' }
            ]}
            error={errors['isMortgaged']}
            />
            <RadioGroup
            label="Đang đăng ký giao dịch bảo đảm?"
            name="isSecured"
            value={formData.isSecured}
            onChange={(v) => updateData('isSecured', v)}
            options={[
                { value: 'co', label: 'Có' },
                { value: 'khong', label: 'Không' }
            ]}
            error={errors['isSecured']}
            />
        </div>
         <RadioGroup
            label='Trên GCN có ghi "Nợ nghĩa vụ tài chính"?'
            name="hasFinancialDebt"
            value={formData.hasFinancialDebt}
            onChange={(v) => updateData('hasFinancialDebt', v)}
            options={[
                { value: 'co', label: 'Có' },
                { value: 'khong', label: 'Không' }
            ]}
            error={errors['hasFinancialDebt']}
            />
      </div>
    </div>
  );

  const renderOwnerDetailsStep = (ownerIndex: number) => {
    const owner = formData.owners[ownerIndex];
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
           <h2 className="text-lg font-semibold text-blue-800">
              Chi tiết Chủ sở hữu thứ {ownerIndex + 1}
           </h2>
           <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
             {ownerIndex + 1} / {formData.owners.length}
           </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label required>Họ và tên</Label>
                <Input 
                    value={owner.name} 
                    onChange={(e) => updateOwner(ownerIndex, 'name', e.target.value.toUpperCase())}
                    placeholder="NGUYỄN VĂN A"
                    error={errors['name']}
                />
            </div>
            <div>
                <Label required>Ngày sinh</Label>
                <Input 
                    type="date"
                    value={owner.birthDate} 
                    onChange={(e) => updateOwner(ownerIndex, 'birthDate', e.target.value)}
                    error={errors['birthDate']}
                />
                <p className="text-sm text-blue-600 mt-1 italic">
                    Tính {getAgeExact(owner.birthDate, formData.guidanceDate)} tuổi = ({formatDate(formData.guidanceDate)} - {formatDate(owner.birthDate)}) / 365.25
                </p>
            </div>
        </div>
        
        {/* Gender Selection */}
        <div className={`mt-2 ${errors['gender'] ? 'p-3 bg-red-50 border border-red-200 rounded' : ''}`}>
            <Label required>Cách xưng hô</Label>
            <div className="flex space-x-4 mt-2">
                 <label className="inline-flex items-center">
                    <input type="radio" checked={owner.gender === 'ong'} onChange={() => updateOwner(ownerIndex, 'gender', 'ong')} className="form-radio h-4 w-4 text-blue-600"/>
                    <span className="ml-2">Ông</span>
                 </label>
                 <label className="inline-flex items-center">
                    <input type="radio" checked={owner.gender === 'ba'} onChange={() => updateOwner(ownerIndex, 'gender', 'ba')} className="form-radio h-4 w-4 text-blue-600"/>
                    <span className="ml-2">Bà</span>
                 </label>
            </div>
            {errors['gender'] && <p className="text-red-500 text-xs mt-2 font-medium">{errors['gender']}</p>}
        </div>

        {/* Marital Status Block */}
        <div className="pt-6 border-t border-slate-200">
           <div className={`${errors['maritalStatus'] ? 'p-3 bg-red-50 border border-red-200 rounded' : ''}`}>
             <Label required>Tình trạng hôn nhân</Label>
             <div className="flex space-x-6 mt-2 mb-4">
                   <label className="inline-flex items-center">
                      <input type="radio" 
                          name={`ms-${owner.id}`}
                          checked={owner.maritalStatus === 'doc_than'} 
                          onChange={() => updateOwner(ownerIndex, 'maritalStatus', 'doc_than')} 
                          className="form-radio h-4 w-4 text-blue-600"/>
                      <span className="ml-2 font-medium">Đang độc thân</span>
                   </label>
                   <label className="inline-flex items-center">
                      <input type="radio" 
                          name={`ms-${owner.id}`}
                          checked={owner.maritalStatus === 'co_vo_chong'} 
                          onChange={() => updateOwner(ownerIndex, 'maritalStatus', 'co_vo_chong')} 
                          className="form-radio h-4 w-4 text-blue-600"/>
                      <span className="ml-2 font-medium">Đang có vợ/chồng</span>
                   </label>
              </div>
              {errors['maritalStatus'] && <p className="text-red-500 text-xs mt-1 font-medium">{errors['maritalStatus']}</p>}
           </div>

            {/* SINGLE LOGIC */}
            {owner.maritalStatus === 'doc_than' && (
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-4">
                    <Label required>Chi tiết tình trạng độc thân:</Label>
                    <Select 
                        value={owner.singleStatusType || ''}
                        onChange={(e) => updateOwner(ownerIndex, 'singleStatusType', e.target.value)}
                        error={errors['singleStatusType']}
                    >
                        <option value="">-- Chọn --</option>
                        <option value="chua_ket_hon">Chưa kết hôn lần nào</option>
                        <option value="da_ly_hon">Đã ly hôn</option>
                        <option value="vo_chong_chet">Vợ/chồng đã chết</option>
                    </Select>

                    {owner.singleStatusType === 'da_ly_hon' && (
                        <div className="pl-4 border-l-2 border-blue-300 space-y-3">
                             <div>
                                <Label required>Ngày ly hôn</Label>
                                <Input type="date" value={owner.divorceDate || ''} onChange={(e) => updateOwner(ownerIndex, 'divorceDate', e.target.value)} error={errors['divorceDate']} />
                                <p className="text-xs text-slate-500 mt-1">Vui lòng ghi đúng theo Bản án ly hôn hoặc theo Giấy xác nhận tình trạng hôn nhân (nếu có).</p>
                             </div>
                             
                             {/* Only show Ex-Spouse info if Ownership Date <= Divorce Date */}
                             {formData.propertyOwnershipDate && owner.divorceDate && 
                              new Date(formData.propertyOwnershipDate) <= new Date(owner.divorceDate) && (
                                <div className="animate-fade-in bg-white p-3 border border-slate-200 rounded">
                                     <div className="mb-2">
                                        <Label required>Họ tên Vợ/Chồng cũ</Label>
                                        <Input value={owner.exSpouseNameDivorce || ''} onChange={(e) => updateOwner(ownerIndex, 'exSpouseNameDivorce', e.target.value.toUpperCase())} error={errors['exSpouseNameDivorce']} />
                                     </div>
                                     <div className={`${errors['exSpouseGenderDivorce'] ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                                        <div className="flex gap-4">
                                            <Label required>Xưng hô:</Label>
                                            <label><input type="radio" checked={owner.exSpouseGenderDivorce === 'ong'} onChange={() => updateOwner(ownerIndex, 'exSpouseGenderDivorce', 'ong')} /> Ông</label>
                                            <label><input type="radio" checked={owner.exSpouseGenderDivorce === 'ba'} onChange={() => updateOwner(ownerIndex, 'exSpouseGenderDivorce', 'ba')} /> Bà</label>
                                        </div>
                                        {errors['exSpouseGenderDivorce'] && <p className="text-red-500 text-xs mt-1">{errors['exSpouseGenderDivorce']}</p>}
                                     </div>
                                </div>
                             )}
                        </div>
                    )}

                    {owner.singleStatusType === 'vo_chong_chet' && (
                        <div className="pl-4 border-l-2 border-gray-500 space-y-3">
                             <div>
                                <Label required>Ngày vợ/chồng chết</Label>
                                <Input type="date" value={owner.spouseDeathDate || ''} onChange={(e) => updateOwner(ownerIndex, 'spouseDeathDate', e.target.value)} error={errors['spouseDeathDate']} />
                                <p className="text-xs text-slate-500 mt-1">Vui lòng ghi đúng theo Giấy chứng tử hoặc Giấy xác nhận tình trạng hôn nhân (nếu có).</p>
                             </div>

                             {/* Ask Ex-Spouse info if Property <= Death Date */}
                             {formData.propertyOwnershipDate && owner.spouseDeathDate && 
                              new Date(formData.propertyOwnershipDate) <= new Date(owner.spouseDeathDate) && (
                                 <div className="animate-fade-in bg-white p-3 border border-slate-200 rounded">
                                    <div className="mb-2">
                                        <Label required>Họ tên Vợ/Chồng đã mất</Label>
                                        <Input value={owner.exSpouseNameDeath || ''} onChange={(e) => updateOwner(ownerIndex, 'exSpouseNameDeath', e.target.value.toUpperCase())} error={errors['exSpouseNameDeath']} />
                                    </div>
                                    <div className={`${errors['exSpouseGenderDeath'] ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                                        <div className="flex gap-4">
                                            <Label required>Xưng hô:</Label>
                                            <label><input type="radio" checked={owner.exSpouseGenderDeath === 'ong'} onChange={() => updateOwner(ownerIndex, 'exSpouseGenderDeath', 'ong')} /> Ông</label>
                                            <label><input type="radio" checked={owner.exSpouseGenderDeath === 'ba'} onChange={() => updateOwner(ownerIndex, 'exSpouseGenderDeath', 'ba')} /> Bà</label>
                                        </div>
                                        {errors['exSpouseGenderDeath'] && <p className="text-red-500 text-xs mt-1">{errors['exSpouseGenderDeath']}</p>}
                                    </div>
                                 </div>
                              )}
                        </div>
                    )}
                </div>
            )}

            {/* MARRIED LOGIC */}
            {owner.maritalStatus === 'co_vo_chong' && (
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-4">
                     <div>
                          <Label required>Ngày đăng ký kết hôn</Label>
                          <Input type="date" value={owner.marriageDate || ''} onChange={(e) => updateOwner(ownerIndex, 'marriageDate', e.target.value)} error={errors['marriageDate']} />
                     </div>

                     {/* Logic [A2-2.0.a]: Ask Current Spouse if MarriageDate <= PropertyDate */}
                     {formData.propertyOwnershipDate && owner.marriageDate && 
                      new Date(owner.marriageDate) <= new Date(formData.propertyOwnershipDate) && (
                        <div className="animate-fade-in bg-white p-3 border border-slate-200 rounded">
                            <div className="mb-2">
                                <Label required>Họ tên Vợ/Chồng hiện tại</Label>
                                <Input value={owner.currentSpouseName || ''} onChange={(e) => updateOwner(ownerIndex, 'currentSpouseName', e.target.value.toUpperCase())} error={errors['currentSpouseName']} />
                            </div>
                            <div className={`${errors['currentSpouseGender'] ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                                <div className="flex gap-4">
                                    <Label required>Xưng hô với Vợ/Chồng hiện tại:</Label>
                                    <label><input type="radio" checked={owner.currentSpouseGender === 'ong'} onChange={() => updateOwner(ownerIndex, 'currentSpouseGender', 'ong')} /> Ông</label>
                                    <label><input type="radio" checked={owner.currentSpouseGender === 'ba'} onChange={() => updateOwner(ownerIndex, 'currentSpouseGender', 'ba')} /> Bà</label>
                                </div>
                                {errors['currentSpouseGender'] && <p className="text-red-500 text-xs mt-1">{errors['currentSpouseGender']}</p>}
                            </div>
                        </div>
                      )}


                     <div className={`pt-2 ${errors['marriageType'] ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                        <Label required>Chi tiết kết hôn:</Label>
                        <div className="flex flex-col space-y-2 mt-1">
                             <label className="inline-flex items-center">
                                <input type="radio" name={`mt-${owner.id}`} checked={owner.marriageType === 'lan_dau'} onChange={() => updateOwner(ownerIndex, 'marriageType', 'lan_dau')} className="form-radio text-blue-600"/>
                                <span className="ml-2">KẾT HÔN LẦN ĐẦU</span>
                             </label>
                             <label className="inline-flex items-center">
                                <input type="radio" name={`mt-${owner.id}`} checked={owner.marriageType === 'khong_phai_lan_dau'} onChange={() => updateOwner(ownerIndex, 'marriageType', 'khong_phai_lan_dau')} className="form-radio text-blue-600"/>
                                <span className="ml-2">KHÔNG PHẢI KẾT HÔN LẦN ĐẦU</span>
                             </label>
                        </div>
                        {errors['marriageType'] && <p className="text-red-500 text-xs mt-1">{errors['marriageType']}</p>}
                     </div>

                     {owner.marriageType === 'khong_phai_lan_dau' && (
                         <div className="pl-4 border-l-2 border-orange-300 space-y-3 mt-2">
                             <div className={`${errors['prevMarriageEndReason'] ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                                 <Label required>Lý do chấm dứt hôn nhân trước đây:</Label>
                                 <div className="flex space-x-4">
                                     <label><input type="radio" name={`pr-${owner.id}`} checked={owner.prevMarriageEndReason === 'ly_hon'} onChange={() => updateOwner(ownerIndex, 'prevMarriageEndReason', 'ly_hon')} /> LY HÔN</label>
                                     <label><input type="radio" name={`pr-${owner.id}`} checked={owner.prevMarriageEndReason === 'chet'} onChange={() => updateOwner(ownerIndex, 'prevMarriageEndReason', 'chet')} /> VỢ/CHỒNG ĐÃ CHẾT</label>
                                 </div>
                                 {errors['prevMarriageEndReason'] && <p className="text-red-500 text-xs mt-1">{errors['prevMarriageEndReason']}</p>}
                             </div>

                             {owner.prevMarriageEndReason === 'ly_hon' && (
                                 <div>
                                     <Label required>Ngày ly hôn trước đây</Label>
                                     <Input type="date" value={owner.prevDivorceDate || ''} onChange={(e) => updateOwner(ownerIndex, 'prevDivorceDate', e.target.value)} error={errors['prevDivorceDate']} />
                                     <p className="text-xs text-slate-500 mt-1">Ghi đúng theo Bản án ly hôn hoặc theo Giấy xác nhận tình trạng hôn nhân (nếu có).</p>
                                 </div>
                             )}
                              {owner.prevMarriageEndReason === 'chet' && (
                                 <div>
                                     <Label required>Ngày vợ/chồng trước chết</Label>
                                     <Input type="date" value={owner.prevSpouseDeathDate || ''} onChange={(e) => updateOwner(ownerIndex, 'prevSpouseDeathDate', e.target.value)} error={errors['prevSpouseDeathDate']} />
                                     <p className="text-xs text-slate-500 mt-1">Ghi đúng theo Giấy chứng tử hoặc Giấy xác nhận tình trạng hôn nhân.</p>
                                 </div>
                             )}

                             {/* [A2-2.3] Ask Previous Spouse */}
                             {/* Condition: (Divorce && Asset<=DivorceDate) OR (Death && Asset<=DeathDate) */}
                             {formData.propertyOwnershipDate && (
                                 (owner.prevMarriageEndReason === 'ly_hon' && owner.prevDivorceDate && new Date(formData.propertyOwnershipDate) <= new Date(owner.prevDivorceDate))
                                 ||
                                 (owner.prevMarriageEndReason === 'chet' && owner.prevSpouseDeathDate && new Date(formData.propertyOwnershipDate) <= new Date(owner.prevSpouseDeathDate))
                             ) && (
                                <div className="animate-fade-in bg-white p-3 border border-slate-200 rounded">
                                    <Label required>Thông tin Vợ/Chồng trước đây:</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div className="w-full">
                                            <Input placeholder="Họ tên" value={owner.prevSpouseName || ''} onChange={(e) => updateOwner(ownerIndex, 'prevSpouseName', e.target.value.toUpperCase())} error={errors['prevSpouseName']} />
                                        </div>
                                        <div className={`flex items-center gap-2 ${errors['prevSpouseGender'] ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                                            <label><input type="radio" checked={owner.prevSpouseGender === 'ong'} onChange={() => updateOwner(ownerIndex, 'prevSpouseGender', 'ong')} /> Ông</label>
                                            <label><input type="radio" checked={owner.prevSpouseGender === 'ba'} onChange={() => updateOwner(ownerIndex, 'prevSpouseGender', 'ba')} /> Bà</label>
                                            {errors['prevSpouseGender'] && <span className="text-red-500 text-xs">!</span>}
                                        </div>
                                    </div>
                                </div>
                             )}
                         </div>
                     )}
                </div>
            )}
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
            <div className="flex justify-center mb-4">
                <CheckCircle size={48} className="text-green-600"/>
            </div>
            <h2 className="text-2xl font-bold text-green-800">Kết quả hướng dẫn</h2>
            <p className="text-green-700 mt-2">Dưới đây là danh sách hồ sơ cần chuẩn bị dựa trên thông tin bạn cung cấp.</p>
        </div>

        <div className="space-y-4">
            {results.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded flex gap-2">
                   <AlertTriangle/> Không có hướng dẫn cụ thể nào được tạo ra. Vui lòng kiểm tra lại ngày tháng năm sinh hoặc ngày sở hữu tài sản.
                </div>
            ) : (
                results.map((res, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-lg shadow border border-slate-200 whitespace-pre-line">
                        {res}
                    </div>
                ))
            )}
        </div>
        
        {/* MODULE_KET_THUC_STEP_B */}
        <div className="bg-slate-100 p-4 rounded-lg text-slate-600 text-sm italic border-t-2 border-slate-300">
            <strong>[GHI CHÚ]</strong> Nội dung hướng dẫn nêu trên chỉ mang TÍNH CHẤT THAM KHẢO
        (dựa trên dữ liệu do Quý khách cung cấp),
        nhằm hỗ trợ Quý khách chủ động chuẩn bị trước hồ sơ.
        Quý khách vui lòng liên hệ trực tiếp, xuất trình giấy tờ cụ thể
        để được hướng dẫn, giải quyết theo quy định.
        CẢM ƠN QUÝ KHÁCH ĐÃ TRẢI NGHIỆM
        PHIÊN BẢN HƯỚNG DẪN HỒ SƠ CÔNG CHỨNG CỦA PHÒNG CÔNG CHỨNG SỐ 5 - PHIÊN BẢN 3.9.
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={downloadReport}
                className="flex-1 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
                <Download size={20}/> Tải phiếu hướng dẫn (.doc)
            </button>
            <button 
                onClick={resetApp}
                className="flex-1 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
                Thực hiện lại
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">PHÒNG CÔNG CHỨNG SỐ 5</h1>
          <p className="mt-2 text-slate-600">Hệ thống hướng dẫn hồ sơ ban đầu (Cá nhân) - Ver 3.9</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Progress Bar (Simple) */}
          {!completed && (
            <div className="w-full bg-slate-200 h-2">
               <div 
                 className="bg-blue-600 h-2 transition-all duration-300" 
                 style={{ width: `${((step + 1) / (3 + formData.owners.length)) * 100}%` }}
               ></div>
            </div>
          )}

          <div className="p-6 md:p-8">
            {completed ? (
                renderResults()
            ) : (
                <>
                   {step === 0 && renderStep0()}
                   {step === 1 && renderStep1()}
                   {step === 2 && renderStep2()}
                   {step > 2 && step <= 2 + formData.owners.length && renderOwnerDetailsStep(step - 3)}

                   <div className="mt-8 flex justify-between pt-4 border-t border-slate-100">
                        <button
                            onClick={handleBack}
                            disabled={step === 0}
                            className={`flex items-center px-4 py-2 rounded text-slate-600 hover:bg-slate-100 transition-colors ${step === 0 ? 'opacity-0 cursor-default' : ''}`}
                        >
                            <ArrowLeft className="mr-2" size={18}/> Quay lại
                        </button>

                        <button
                            onClick={handleContinue}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            {step === 2 + formData.owners.length ? 'Xem kết quả' : 'Tiếp tục'} 
                            {step !== 2 + formData.owners.length && <ArrowRight className="ml-2" size={18}/>}
                        </button>
                   </div>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
