(() => {
  const key = "sss-language";
  const pairs = [
    ["Language", "ภาษา"], ["Language / ภาษา", "ภาษา"], ["Theme ·", "ธีม ·"], ["Display mode", "โหมดแสดงผล"], ["Live", "สด"], ["Connection failed", "เชื่อมต่อไม่ได้"], ["Text size", "ขนาดตัวอักษร"], ["Standard", "มาตรฐาน"], ["Large", "ใหญ่"], ["Extra large", "ใหญ่มาก"],
    ["Text size / ขนาดตัวอักษร", "ขนาดตัวอักษร"],
    ["Speedship Attendance", "Speedship · ระบบลงเวลา"], ["Speedship Management Access", "Speedship · เข้าสู่ระบบจัดการ"],
    ["HR Attendance Dashboard", "แดชบอร์ดลงเวลาฝ่ายบุคคล"], ["Admin Attendance Dashboard", "แดชบอร์ดผู้ดูแลระบบลงเวลา"], ["C-Level Attendance Dashboard", "แดชบอร์ดลงเวลาสำหรับผู้บริหาร"],
    ["Attendance · Employee time recording", "Attendance · บันทึกเวลาพนักงาน"],
    ["Clock in and out", "ลงเวลาเข้าและออกงาน"], ["Choose a location and employee, take a photo, then save your attendance.", "เลือกสาขา เลือกชื่อ ถ่ายรูป แล้วกดบันทึก ระบบจะจัดเก็บทันที"],
    ["Management", "จัดการระบบ"], ["Location and attendance type", "สถานที่และประเภทการลงเวลา"], ["Location", "สถานที่"], ["Attendance type", "ประเภทการลงเวลา"],
    ["Attendance", "ลงเวลา"], ["Clock in", "เข้างาน"], ["Clock out", "ออกงาน"], ["Select employee", "เลือกพนักงาน"], ["Change", "เปลี่ยน"],
    ["Search name, nickname or employee ID", "ค้นหาชื่อ ชื่อเล่น หรือรหัสพนักงาน"], ["Choose a location first", "กรุณาเลือกสถานที่ก่อน"],
    ["Notes", "หมายเหตุ"], ["e.g. rain, missed clock-in or off-site work", "เช่น ฝนตก, ลืมกดเข้างาน, ทำงานนอกสถานที่"],
    ["Optional", "ไม่บังคับ"], ["Photo confirmation", "ยืนยันด้วยรูปถ่าย"], ["Turn on the camera to take a photo", "เปิดกล้องเพื่อถ่ายรูป"],
    ["Photos are compressed before upload for faster saving.", "รูปจะถูกบีบอัดก่อนอัปโหลดเพื่อให้บันทึกเร็วขึ้น"],
    ["Open camera", "เปิดกล้อง"], ["Close camera", "ปิดกล้อง"], ["Take photo", "ถ่ายรูป"], ["Retake", "ถ่ายใหม่"],
    ["Photo", "รูปถ่าย"], ["Employee", "พนักงาน"], ["Checking", "รอตรวจสอบ"], ["No photo yet", "ยังไม่มีรูป"], ["Not selected", "ยังไม่ได้เลือก"],
    ["Not ready", "ยังไม่พร้อม"], ["Photo taken", "ถ่ายแล้ว"], ["Connecting", "กำลังเชื่อมต่อ"], ["Loading...", "กำลังโหลด..."], ["Loading…", "กำลังโหลด…"],
    ["Select location", "เลือกสถานที่"], ["No employees found at this location", "ไม่พบพนักงานในสาขานี้"],
    ["Save clock-in", "ลงชื่อเข้างาน"], ["Save clock-out", "ลงชื่อออกงาน"], ["Saving...", "กำลังบันทึก..."],
    ["Duplicate attendance found", "พบการลงเวลาซ้ำ"], ["Cancel", "ยกเลิก"], ["Save again", "บันทึกซ้ำ"],
    ["already clocked in at", "มีการลงชื่อเข้างานที่"], ["already clocked out at", "มีการลงชื่อออกงานที่"],
    ["today. Save another record?", "วันนี้แล้ว ต้องการบันทึกซ้ำหรือไม่"],
    ["Unable to connect to the system", "เชื่อมต่อระบบไม่ได้"], ["This device does not support a camera", "อุปกรณ์นี้ไม่รองรับกล้อง"],
    ["Please use the latest Safari or Chrome version", "กรุณาใช้ Safari หรือ Chrome เวอร์ชันล่าสุด"], ["Unable to open camera", "เปิดกล้องไม่ได้"],
    ["Attendance saved", "บันทึกเวลาแล้ว"], ["Unable to save attendance", "บันทึกไม่สำเร็จ"],
    ["Uploading photo and location", "กำลังอัปโหลดรูปและตำแหน่ง"], ["Photo and GPS saved", "รูปและ GPS บันทึกเรียบร้อย"],
    ["Captured attendance photo", "รูปถ่ายยืนยันการลงเวลา"], ["Auto display mode", "โหมดแสดงผลอัตโนมัติ"], ["Light display mode", "โหมดสว่าง"], ["Dark display mode", "โหมดมืด"],
    ["Auto", "อัตโนมัติ"], ["Light", "สว่าง"], ["Dark", "มืด"], ["Theme", "ธีม"],
    ["People & Operations Intelligence", "ข้อมูลบุคลากรและการปฏิบัติงาน"], ["Management access", "เข้าสู่ระบบจัดการ"],
    ["One secure login.", "เข้าสู่ระบบอย่างปลอดภัย"], ["Role-based access.", "เข้าถึงตามสิทธิ์ที่ได้รับ"],
    ["HR, Admin and C-Level accounts use individual credentials. New accounts cannot choose their own permissions. A Super Admin must approve and assign every role.", "HR ผู้ดูแลระบบ และผู้บริหาร ใช้บัญชีส่วนตัวในการเข้าสู่ระบบ บัญชีใหม่ไม่สามารถเลือกสิทธิ์เองได้ ผู้ดูแลระบบสูงสุดจะเป็นผู้อนุมัติและกำหนดสิทธิ์ให้"],
    ["Individual sign-in", "บัญชีส่วนตัว"], ["No shared dashboard password", "ไม่ใช้รหัสผ่านร่วมกัน"], ["Approval required", "ต้องได้รับการอนุมัติ"],
    ["Registration does not grant dashboard access", "การลงทะเบียนไม่ได้ให้สิทธิ์เข้าถึงแดชบอร์ดทันที"], ["Server-enforced roles", "ตรวจสอบสิทธิ์จากระบบ"],
    ["Permissions are checked on every protected API request", "ระบบตรวจสอบสิทธิ์ทุกครั้งที่เข้าถึงข้อมูลที่จำกัดสิทธิ์"], ["Secure portal", "ระบบเข้าสู่ระบบที่ปลอดภัย"],
    ["Management Dashboard", "แดชบอร์ดจัดการ"], ["For HR, Admin and C-Level only. Access follows the role assigned by the Super Admin.", "สำหรับ HR, Admin และ C-Level เท่านั้น ระบบจะเปิดหน้าที่ตรงกับสิทธิ์ที่ Super Admin กำหนด"],
    ["Sign in", "เข้าสู่ระบบ"], ["Register access", "ขอสิทธิ์เข้าใช้งาน"], ["Work email", "อีเมลบริษัท"], ["Password", "รหัสผ่าน"], ["Enter password", "กรอกรหัสผ่าน"],
    ["Forgot password?", "ลืมรหัสผ่าน?"], ["Full name", "ชื่อ-นามสกุล"], ["Job title", "ตำแหน่งงาน"], ["Employee ID", "รหัสพนักงาน"], ["e.g. HR Manager", "เช่น ผู้จัดการฝ่ายบุคคล"],
    ["Confirm", "ยืนยัน"], ["Registration ≠ access", "ลงทะเบียน ≠ ได้รับสิทธิ์ใช้งาน"],
    ["Your account remains Pending until a Super Admin assigns HR, Admin, C-Level or Super Admin access.", "บัญชีจะอยู่ในสถานะรออนุมัติ จนกว่าผู้ดูแลระบบสูงสุดจะกำหนดสิทธิ์ฝ่ายบุคคล ผู้ดูแลระบบ ผู้บริหาร หรือผู้ดูแลระบบสูงสุดให้"],
    ["Create access request", "ส่งคำขอเข้าใช้งาน"], ["← Attendance", "← หน้าลงเวลา"], ["First Super Admin setup", "ตั้งค่าผู้ดูแลระบบสูงสุดคนแรก"],
    ["One-time initialization", "ตั้งค่าครั้งแรก"], ["Initialize the first Super Admin", "ตั้งค่าผู้ดูแลระบบสูงสุดคนแรก"],
    ["Sign in with the verified account that should become the first Super Admin, then enter the bootstrap key. This stops working after the first active Super Admin exists.", "เข้าสู่ระบบด้วยบัญชีที่ยืนยันอีเมลแล้วและต้องการกำหนดเป็นผู้ดูแลระบบสูงสุดคนแรก จากนั้นกรอกคีย์เริ่มต้น ฟังก์ชันนี้ใช้ได้เฉพาะก่อนมีผู้ดูแลระบบสูงสุดที่ใช้งานได้คนแรกเท่านั้น"],
    ["Bootstrap key", "คีย์เริ่มต้นระบบ"], ["Initialize Super Admin", "ตั้งค่าผู้ดูแลระบบสูงสุด"],
    ["Verify your work email", "ยืนยันอีเมลบริษัท"], ["We sent a verification link to", "ส่งลิงก์ยืนยันไปยัง"], [". Verify it before dashboard access can be approved.", " กรุณายืนยันอีเมลก่อนอนุมัติสิทธิ์เข้าใช้งานแดชบอร์ด"],
    ["Resend verification", "ส่งอีเมลยืนยันอีกครั้ง"], ["Sign out", "ออกจากระบบ"], ["Verification email sent", "ส่งอีเมลยืนยันแล้ว"],
    ["Access request pending", "คำขอเข้าใช้งานรออนุมัติ"], ["is registered, but no dashboard role has been approved yet.", "ลงทะเบียนแล้ว แต่ยังไม่ได้รับการอนุมัติสิทธิ์เข้าใช้งานแดชบอร์ด"],
    ["Registered", "ลงทะเบียนแล้ว"], ["Super Admin review", "รอผู้ดูแลระบบสูงสุดตรวจสอบ"], ["Role assigned", "กำหนดสิทธิ์แล้ว"], ["Check again", "ตรวจสอบอีกครั้ง"],
    ["Signed in as", "เข้าสู่ระบบด้วยบัญชี"], ["Open dashboard", "เปิดแดชบอร์ด"], ["Signing in…", "กำลังเข้าสู่ระบบ…"],
    ["Use your @speedshipsolution.com work email", "กรุณาใช้อีเมลบริษัท @speedshipsolution.com"], ["Passwords do not match", "รหัสผ่านไม่ตรงกัน"],
    ["Creating request…", "กำลังส่งคำขอ…"], ["Access request created. Verify your email next.", "ส่งคำขอเข้าใช้งานแล้ว กรุณายืนยันอีเมลเป็นขั้นตอนถัดไป"],
    ["Enter your work email first", "กรุณากรอกอีเมลบริษัทก่อน"], ["Password reset email sent", "ส่งอีเมลสำหรับตั้งรหัสผ่านใหม่แล้ว"],
    ["Sign in with your verified work account first", "กรุณาเข้าสู่ระบบด้วยบัญชีบริษัทที่ยืนยันอีเมลแล้วก่อน"], ["Verify your work email first", "กรุณายืนยันอีเมลบริษัทก่อน"],
    ["Enter the bootstrap key", "กรุณากรอกคีย์เริ่มต้นระบบ"], ["Super Admin initialized", "ตั้งค่าผู้ดูแลระบบสูงสุดแล้ว"],
    ["HR", "ฝ่ายบุคคล"], ["Admin", "ผู้ดูแลระบบ"], ["System Admin", "ผู้ดูแลระบบ"], ["Super Admin", "ผู้ดูแลระบบสูงสุด"], ["SUPER ADMIN", "ผู้ดูแลระบบสูงสุด"], ["C-Level", "ผู้บริหาร"], ["Executive", "ผู้บริหาร"],
    ["HR Records", "บันทึกฝ่ายบุคคล"], ["C-Level Overview", "ภาพรวมผู้บริหาร"], ["Attendance App", "หน้าลงเวลา"], ["Attendance Operations", "จัดการการลงเวลา"],
    ["Overview", "ภาพรวม"], ["More", "เพิ่มเติม"], ["Dashboard", "แดชบอร์ด"], ["Dashboard menu", "เมนูแดชบอร์ด"], ["Close menu", "ปิดเมนู"],
    ["Attendance records · Asia/Bangkok", "บันทึกลงเวลา · เวลาประเทศไทย"], ["Attendance period", "ช่วงเวลาลงเวลา"], ["Refresh", "รีเฟรช"],
    ["HR Attendance Records", "บันทึกลงเวลาฝ่ายบุคคล"], ["Attendance System Admin", "ผู้ดูแลระบบลงเวลา"], ["C-Level Attendance Overview", "ภาพรวมการลงเวลาสำหรับผู้บริหาร"],
    ["Loading dashboard…", "กำลังโหลดแดชบอร์ด…"], ["Session expired", "เซสชันหมดอายุ"], ["Your Firebase session could not be refreshed.", "ไม่สามารถต่ออายุเซสชันได้"],
    ["Sign in again", "เข้าสู่ระบบอีกครั้ง"], ["Dashboard access denied", "ไม่มีสิทธิ์เข้าถึงแดชบอร์ด"], ["Back to management login", "กลับไปหน้าเข้าสู่ระบบจัดการ"],
    ["Unable to load dashboard", "โหลดแดชบอร์ดไม่ได้"], ["Executive attendance overview", "ภาพรวมการลงเวลาสำหรับผู้บริหาร"],
    ["Workforce attendance, punctuality and record completeness at a glance.", "ภาพรวมการลงเวลา ความตรงต่อเวลา และความครบถ้วนของบันทึกพนักงาน"],
    ["Attendance operations", "จัดการการลงเวลา"], ["Daily attendance follow-up, employee history and attendance exceptions.", "ติดตามการลงเวลารายวัน ประวัติพนักงาน และรายการที่ต้องตรวจสอบ"],
    ["Attendance system control", "จัดการระบบลงเวลา"], ["Employee records, dashboard access and Firebase → Google Sheets sync.", "ข้อมูลพนักงาน สิทธิ์เข้าใช้งานแดชบอร์ด และการซิงค์ Firebase → Google Sheets"],
    ["Active employees", "พนักงานที่ใช้งานอยู่"], ["Inactive employees", "พนักงานที่ไม่ใช้งาน"], ["Checked in today", "ลงเวลาเข้างานวันนี้"], ["On-time rate", "อัตราการมาตรงเวลา"],
    ["Complete IN / OUT", "ลงเวลาเข้าและออกครบ"], ["Today", "วันนี้"], ["Attendance coverage", "สัดส่วนการลงเวลา"],
    ["Employees with at least one check-in today. “No check-in yet” is not treated as absence.", "พนักงานที่ลงเวลาเข้างานอย่างน้อยหนึ่งครั้งในวันนี้ การยังไม่พบเวลาเข้างานไม่ได้หมายถึงการขาดงาน"],
    ["Trend", "แนวโน้ม"], ["Daily attendance activity", "การลงเวลารายวัน"], ["Unique employees with attendance activity per day.", "จำนวนพนักงานไม่ซ้ำที่มีการลงเวลาในแต่ละวัน"],
    ["Follow-up", "รายการติดตาม"], ["Attendance exceptions", "รายการลงเวลาที่ต้องตรวจสอบ"],
    ["Late records, missing check-outs and attendance notes in the selected period.", "รายการมาสาย ไม่พบเวลาออกงาน และหมายเหตุการลงเวลาในช่วงที่เลือก"],
    ["Locations", "สาขา"], ["Attendance activity by branch", "การลงเวลาแยกตามสาขา"], ["Recorded activity by work location.", "รายการลงเวลาแยกตามสถานที่ทำงาน"],
    ["Employee attendance master", "ทะเบียนการลงเวลาพนักงาน"], ["Attendance records by employee", "บันทึกลงเวลาแยกตามพนักงาน"],
    ["Click a row to review recent IN/OUT history and HR-only details.", "คลิกที่แถวเพื่อตรวจสอบประวัติเข้าและออกงานล่าสุด รวมถึงข้อมูลสำหรับฝ่ายบุคคล"],
    ["Add employee", "เพิ่มพนักงาน"], ["Search employee", "ค้นหาพนักงาน"], ["All status", "ทุกสถานะ"], ["Export CSV", "ส่งออก CSV"],
    ["Employee management", "จัดการพนักงาน"], ["Create employee record", "สร้างข้อมูลพนักงาน"],
    ["Attendance stays V2-style with no employee login or self-registration.", "พนักงานลงเวลาได้โดยไม่ต้องเข้าสู่ระบบหรือลงทะเบียนด้วยตนเอง"],
    ["HR/Admin owns employee onboarding. Dashboard accounts are a separate management-only access system.", "ฝ่ายบุคคลและผู้ดูแลระบบเป็นผู้เพิ่มพนักงาน บัญชีแดชบอร์ดเป็นบัญชีจัดการที่แยกจากข้อมูลพนักงาน"],
    ["System health", "สถานะระบบ"], ["Firebase → Google Sheets sync", "ซิงค์ Firebase → Google Sheets"], ["Activity", "กิจกรรม"], ["Daily active employees", "พนักงานที่ลงเวลาในแต่ละวัน"],
    ["Employee count", "จำนวนพนักงาน"], ["Current workforce", "พนักงานปัจจุบัน"], ["Active employees available on the attendance page.", "พนักงานที่มีสถานะใช้งานและเลือกลงเวลาได้"],
    ["Employee master", "ทะเบียนพนักงาน"], ["Employee records", "ข้อมูลพนักงาน"], ["Unassigned", "ยังไม่กำหนดสิทธิ์"], ["Manage", "จัดการ"],
    ["Account details", "รายละเอียดบัญชี"], ["Last sign-in", "เข้าสู่ระบบล่าสุด"], ["Super Admin · Access control", "ผู้ดูแลระบบสูงสุด · กำหนดสิทธิ์"],
    ["Dashboard accounts", "บัญชีแดชบอร์ด"], ["Super Admin approves accounts and assigns access.", "ผู้ดูแลระบบสูงสุดเป็นผู้อนุมัติบัญชีและกำหนดสิทธิ์"],
    ["User", "ผู้ใช้งาน"], ["Role", "สิทธิ์"], ["Status", "สถานะ"], ["No dashboard accounts yet.", "ยังไม่มีบัญชีแดชบอร์ด"],
    ["Attendance trend", "แนวโน้มการลงเวลา"], ["Daily workforce attendance", "การลงเวลาของพนักงานรายวัน"],
    ["Unique employees with recorded attendance activity each day.", "จำนวนพนักงานไม่ซ้ำที่มีบันทึกลงเวลาในแต่ละวัน"], ["Branch activity", "การลงเวลาของแต่ละสาขา"],
    ["Recorded employee-days", "วันลงเวลารวมของพนักงาน"], ["Days with at least one IN or OUT", "วันที่มีเวลาเข้างานหรือออกงานอย่างน้อยหนึ่งรายการ"],
    ["Complete employee-days", "วันที่ลงเวลาครบเข้าและออก"], ["Days with both IN and OUT", "วันที่มีทั้งเวลาเข้างานและออกงาน"],
    ["Late records", "รายการมาสาย"], ["Based on mapped shift start", "เทียบกับเวลาเริ่มกะที่กำหนด"], ["Missing check-outs", "ไม่พบเวลาออกงาน"], ["IN recorded without OUT", "มีเวลาเข้างานแต่ไม่มีเวลาออกงาน"],
    ["Attendance exception summary", "สรุปรายการลงเวลาที่ต้องตรวจสอบ"], ["Operational attendance exceptions only. This is not an employee performance score.", "แสดงรายการลงเวลาที่ต้องตรวจสอบ ไม่ใช่คะแนนประเมินผลงานพนักงาน"],
    ["Period summary", "สรุปช่วงเวลา"], ["Attendance reliability", "ความครบถ้วนและความตรงต่อเวลา"], ["Employee attendance records", "บันทึกลงเวลาพนักงาน"], ["Attendance summary by employee", "สรุปการลงเวลาแยกตามพนักงาน"],
    ["Read-only attendance metrics. Salary and incentive are available to C-Level; phone, bank and private profile data remain excluded.", "ข้อมูลสรุปการลงเวลาสำหรับดูเท่านั้น ผู้บริหารดูเงินเดือนและค่าตอบแทนเพิ่มเติมได้ แต่ไม่สามารถดูเบอร์โทร บัญชีธนาคาร และข้อมูลส่วนตัวในโปรไฟล์"],
    ["No pending registrations.", "ไม่มีรายการลงทะเบียนรออนุมัติ"], ["Action", "ดำเนินการ"], ["Review", "ตรวจสอบ"], ["No attendance data in this period.", "ไม่มีข้อมูลลงเวลาในช่วงนี้"], ["No activity.", "ไม่มีรายการลงเวลา"],
    ["No attendance exceptions", "ไม่พบรายการที่ต้องตรวจสอบ"], ["No late, missing check-out or noted attendance records in this period.", "ไม่มีรายการมาสาย ไม่พบเวลาออกงาน หรือหมายเหตุในช่วงนี้"],
    ["Complete IN / OUT records", "บันทึกเวลาเข้าและออกครบ"], ["On-time records", "รายการมาตรงเวลา"], ["Employee-days with IN but no OUT", "วันลงเวลาที่มีเข้างานแต่ไม่มีออกงาน"],
    ["Attendance notes", "หมายเหตุการลงเวลา"], ["Records with an employee note", "รายการที่มีหมายเหตุจากพนักงาน"], ["Type", "ประเภท"], ["Recorded days", "วันที่มีบันทึก"],
    ["On time", "ตรงเวลา"], ["On-time", "ตรงเวลา"], ["Complete IN/OUT", "ลงเวลาเข้าและออกครบ"], ["Late", "มาสาย"], ["Missing OUT", "ไม่พบเวลาออกงาน"], ["Missing IN", "ไม่พบเวลาเข้างาน"],
    ["Last activity", "ลงเวลาล่าสุด"], ["No matching employees.", "ไม่พบพนักงานที่ตรงกับเงื่อนไข"], ["View record", "ดูบันทึก"], ["Previous", "ก่อนหน้า"], ["Next", "ถัดไป"],
    ["Active", "ใช้งาน"], ["Inactive", "ไม่ใช้งาน"], ["Pending", "รออนุมัติ"], ["Rejected", "ไม่อนุมัติ"], ["Disabled", "ปิดใช้งาน"],
    ["Sync errors", "ข้อผิดพลาดการซิงค์"], ["Record data checks", "ตรวจสอบข้อมูลบันทึก"], ["Unmatched employee IDs", "รหัสพนักงานที่ไม่พบในทะเบียน"], ["Unmatched locations", "สถานที่ที่ไม่พบในระบบ"],
    ["Invalid IN/OUT types", "ประเภทเข้าและออกงานไม่ถูกต้อง"], ["Missing timestamps", "ไม่พบวันและเวลาลงบันทึก"], ["Date/timestamp mismatches", "วันที่กับเวลาบันทึกไม่สอดคล้องกัน"],
    ["No sync errors in this period", "ไม่พบข้อผิดพลาดการซิงค์ในช่วงนี้"], ["Log ID", "รหัสบันทึก"], ["Error reason", "สาเหตุข้อผิดพลาด"], ["Error", "ข้อผิดพลาด"],
    ["No error message was returned. Review this record in Firebase.", "ไม่มีข้อความระบุข้อผิดพลาด กรุณาตรวจสอบรายการนี้ใน Firebase"],
    ["Employee record", "ข้อมูลพนักงาน"], ["Observed days", "วันที่มีบันทึก"], ["Phone", "เบอร์โทรศัพท์"], ["Bank", "ธนาคาร"], ["Bank account", "บัญชีธนาคาร"],
    ["Salary", "เงินเดือน"], ["Incentive", "ค่าตอบแทนเพิ่มเติม"], ["View private profile photo", "ดูรูปโปรไฟล์ที่จำกัดสิทธิ์"], ["Open legacy profile photo", "เปิดรูปโปรไฟล์เดิม"],
    ["Recent attendance days", "วันลงเวลาล่าสุด"], ["C-Level access excludes phone, bank account, private profile photo and detailed attendance-day records.", "สิทธิ์ผู้บริหารไม่รวมเบอร์โทร บัญชีธนาคาร รูปโปรไฟล์ที่จำกัดสิทธิ์ และรายละเอียดลงเวลารายวัน"],
    ["No records in selected period.", "ไม่มีบันทึกในช่วงที่เลือก"], ["Date", "วันที่"], ["IN", "เข้างาน"], ["OUT", "ออกงาน"], ["IN / OUT", "เข้า / ออก"], ["Complete", "ครบถ้วน"], ["Yes", "ใช่"], ["Missing", "ไม่ครบ"],
    ["Loading private photo…", "กำลังโหลดรูปที่จำกัดสิทธิ์…"], ["Private employee photo", "รูปพนักงานที่จำกัดสิทธิ์"], ["Employee approval", "อนุมัติพนักงาน"],
    ["Employee type", "ประเภทพนักงาน"], ["Assigned location", "สถานที่ที่กำหนด"], ["Reject", "ไม่อนุมัติ"], ["Approve", "อนุมัติ"], ["Employee approved", "อนุมัติพนักงานแล้ว"], ["Registration rejected", "ไม่อนุมัติการลงทะเบียน"],
    ["HR / ADMIN", "ฝ่ายบุคคล / ผู้ดูแลระบบ"], ["Normal employees do not create accounts. This creates the employee master record used by the V2 attendance page.", "พนักงานทั่วไปไม่ต้องสร้างบัญชี ฟอร์มนี้ใช้เพิ่มข้อมูลพนักงานสำหรับหน้าลงเวลา"],
    ["Nickname", "ชื่อเล่น"], ["(optional)", "(ไม่บังคับ)"], ["Auto-generate if blank", "สร้างรหัสอัตโนมัติหากเว้นว่าง"], ["Create employee", "สร้างข้อมูลพนักงาน"], ["Creating…", "กำลังสร้างข้อมูล…"],
    ["01.Full-Time_OF", "01.พนักงานประจำสำนักงาน"], ["02.Full-Time_WH", "02.พนักงานประจำคลัง"], ["03.Daily", "03.รายวัน"], ["04.Weekly", "04.รายสัปดาห์"], ["05.Job", "05.ตามงาน"], ["06.Intern", "06.นักศึกษาฝึกงาน"],
    ["Dashboard access", "สิทธิ์เข้าใช้แดชบอร์ด"], ["Assigned role", "สิทธิ์ที่กำหนด"], ["Access status", "สถานะการเข้าถึง"], ["Server enforced", "ตรวจสอบสิทธิ์จากระบบ"],
    ["Changing the page URL or browser storage cannot bypass this role. The backend re-checks the signed-in account on every protected request.", "การเปลี่ยน URL หรือข้อมูลในเบราว์เซอร์ไม่สามารถข้ามสิทธิ์ได้ ระบบตรวจสอบบัญชีที่เข้าสู่ระบบทุกครั้งที่เข้าถึงข้อมูลที่จำกัดสิทธิ์"],
    ["Save access", "บันทึกสิทธิ์"], ["Dashboard access updated", "อัปเดตสิทธิ์เข้าใช้แดชบอร์ดแล้ว"],
    ["Payroll preparation", "เตรียมข้อมูลเงินเดือน"], ["Monthly IN / OUT Calendar", "ปฏิทินเวลาเข้าและออกงานรายเดือน"],
    ["Daily first IN and last OUT by employee status. No record is not automatically treated as absence.", "เวลาเข้างานครั้งแรกและออกงานครั้งสุดท้ายของแต่ละวัน แยกตามสถานะพนักงาน การไม่มีบันทึกไม่ได้หมายถึงการขาดงานโดยอัตโนมัติ"],
    ["Date range", "ช่วงวันที่"], ["Monthly", "รายเดือน"], ["Date to Date", "ระบุช่วงวันที่"], ["Yesterday", "เมื่อวาน"], ["Payroll month", "เดือนสำหรับเงินเดือน"],
    ["From date", "วันที่เริ่มต้น"], ["To date", "วันที่สิ้นสุด"], ["to", "ถึง"], ["Branch", "สาขา"], ["All branches", "ทุกสาขา"], ["Employee status", "สถานะพนักงาน"],
    ["All employees", "พนักงานทั้งหมด"], ["All employee types", "ทุกประเภทพนักงาน"], ["Export payroll CSV", "ส่งออกข้อมูลเงินเดือน CSV"],
    ["No record", "ไม่มีบันทึก"], ["Incomplete", "ไม่ครบถ้วน"], ["Recorded", "มีบันทึก"], ["Span h", "ช่วงเวลา (ชม.)"], ["days", "วัน"], ["recorded h", "ชม.ที่บันทึก"],
    ["Select a valid attendance date range.", "กรุณาเลือกช่วงวันที่ลงเวลาที่ถูกต้อง"], ["No employees match this status, type, branch or search.", "ไม่พบพนักงานที่ตรงกับสถานะ ประเภท สาขา หรือคำค้นที่เลือก"],
    ["Recorded span hours = first IN to last OUT. It is not automatically payable hours, overtime, leave or a salary deduction.", "ช่วงเวลาที่บันทึกนับจากเวลาเข้างานครั้งแรกถึงออกงานครั้งสุดท้าย ไม่ใช่ชั่วโมงที่ใช้จ่ายค่าจ้าง ค่าล่วงเวลา วันลา หรือหักเงินเดือนโดยอัตโนมัติ"],
    ["Payroll calendar could not load: ", "โหลดปฏิทินลงเวลาไม่ได้: "], ["Month", "เดือน"],
    ["Mon", "จ."], ["Tue", "อ."], ["Wed", "พ."], ["Thu", "พฤ."], ["Fri", "ศ."], ["Sat", "ส."], ["Sun", "อา."],
    ["Bang Bo warehouse", "คลังสาขาบางบ่อ"], ["Rama II warehouse", "คลังสาขาพระราม 2"], ["SSS Office", "สำนักงาน SSS"],
    ["Online", "เชื่อมต่อแล้ว"], ["Server error", "ระบบเกิดข้อผิดพลาด"], ["Geolocation is not supported", "อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง"],
    ["Firebase configuration is unavailable", "ไม่สามารถโหลดการตั้งค่า Firebase ได้"], ["Firebase Auth is not configured yet", "ยังไม่ได้ตั้งค่าการเข้าสู่ระบบ Firebase"], ["Sign in first", "กรุณาเข้าสู่ระบบก่อน"],
    ["No location", "ยังไม่กำหนดสถานที่"], ["Role ·", "สิทธิ์ ·"], [" employees", " คน"],
    ["Error (auth/invalid-credential).", "อีเมลหรือรหัสผ่านไม่ถูกต้อง"], ["Error (auth/too-many-requests).", "มีการลองเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่แล้วลองใหม่"],
    ["Error (auth/network-request-failed).", "เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต"], ["Error (auth/email-already-in-use).", "อีเมลนี้มีบัญชีอยู่แล้ว"],
    ["Error (auth/weak-password).", "รหัสผ่านยังไม่ปลอดภัยเพียงพอ"], ["Error (auth/invalid-email).", "รูปแบบอีเมลไม่ถูกต้อง"],
  ];

  pairs.push(
    ["Change dates", "เปลี่ยนวันที่"],
    ["Custom range", "กำหนดช่วงวันที่"],
    ["1–15", "วันที่ 1–15"],
    ["16–Month end", "วันที่ 16–สิ้นเดือน"],
    ["Previous month", "เดือนก่อนหน้า"], ["Next month", "เดือนถัดไป"],
    ["Apply dates", "ใช้ช่วงวันที่นี้"], ["Done", "เสร็จสิ้น"],
    ["Available attendance data", "ช่วงวันที่มีข้อมูลลงเวลา"],
    ["Choose a start date before the end date, within available data.", "กรุณาเลือกวันที่เริ่มต้นไม่เกินวันที่สิ้นสุด และอยู่ในช่วงที่มีข้อมูล"],
    ["Name, ID or nickname", "ชื่อ รหัสพนักงาน หรือชื่อเล่น"],
    ["Full Time Emp Att · Excel", "ส่งออกแบบ Full Time Emp Att · Excel"],
    ["Full Time Emp Att export", "ส่งออกแบบ Full Time Emp Att"],
    ["Confirm the payroll rules for this export.", "กำหนดกติกาคำนวณเงินเดือนสำหรับการส่งออกครั้งนี้"],
    ["Stored salary basis", "ฐานค่าจ้างที่บันทึกในระบบ"],
    ["Daily rate", "ค่าจ้างรายวัน"], ["Monthly salary", "เงินเดือนรายเดือน"],
    ["Monthly divisor", "จำนวนวันที่ใช้หารเงินเดือน"],
    ["Regular hours per day", "ชั่วโมงทำงานปกติต่อวัน"],
    ["OT starts at", "เวลาเริ่มคิด OT"],
    ["OT rounding minutes", "ช่วงนาทีที่ใช้ปัด OT"],
    ["OT rounding method", "วิธีปัดเวลา OT"],
    ["Nearest", "ปัดเป็นช่วงที่ใกล้ที่สุด"], ["Round down", "ปัดลง"], ["Round up", "ปัดขึ้น"],
    ["OT multiplier", "ตัวคูณค่าจ้าง OT"], ["e.g. 1.5", "เช่น 1.5"],
    ["Paid HR statuses", "สถานะการลา / หยุดที่ได้รับค่าจ้าง"],
    ["Include stored incentive in each exported half-period", "รวมค่าตอบแทนเพิ่มเติมที่บันทึกไว้ในแต่ละรอบครึ่งเดือนที่ส่งออก"],
    ["Incomplete records and overnight shifts need HR review. Incentives and additional adjustments can be edited in Excel.", "HR ต้องตรวจสอบวันที่ลงเวลาไม่ครบและกะข้ามคืน สามารถแก้ค่าตอบแทนเพิ่มเติมและรายการปรับยอดใน Excel ได้"],
    ["Download Excel", "ดาวน์โหลด Excel"],
    ["No employees or dates to export.", "ไม่มีพนักงานหรือวันที่สำหรับส่งออก"],
    ["Wait for HR statuses to load before exporting payroll.", "กรุณารอโหลดสถานะจาก HR ให้ครบก่อนส่งออกเงินเดือน"],
    ["Unable to export payroll. Please try again.", "ส่งออกข้อมูลเงินเดือนไม่ได้ กรุณาลองใหม่"],
    ["Paid Time Off", "ลาโดยได้รับค่าจ้าง (PTO)"],
    ["Sick Leave", "ลาป่วย"],
    ["Personal Leave", "ลากิจ"],
    ["Unpaid Leave", "ลาโดยไม่ได้รับค่าจ้าง"],
    ["Day Off", "วันหยุด"],
    ["Public Holiday", "วันหยุดนักขัตฤกษ์"],
    ["Absent", "ขาดงาน"],
    ["Other Leave", "การลา / หยุดอื่น ๆ"],
    ["PTO", "PTO"],
    ["Sick", "ลาป่วย"],
    ["Personal", "ลากิจ"],
    ["Unpaid", "ลาไม่รับค่าจ้าง"],
    ["Off", "วันหยุด"],
    ["Holiday", "วันหยุดนักขัตฤกษ์"],
    ["Other", "อื่น ๆ"],
    ["Day Off / Public Holiday", "วันหยุด / วันหยุดนักขัตฤกษ์"],
    ["HR status days", "วันที่ HR ระบุสถานะ"],
    ["classified", "ระบุสถานะแล้ว"],
    ["Day status", "สถานะประจำวัน"],
    ["HR day status", "สถานะประจำวันโดย HR"],
    ["No HR classification", "ยังไม่ระบุสถานะโดย HR"],
    ["HR note (optional)", "หมายเหตุของ HR (ไม่บังคับ)"],
    ["Close", "ปิด"],
    ["Save HR status", "บันทึกสถานะโดย HR"],
    ["Saving…", "กำลังบันทึก…"],
    ["HR day status saved", "บันทึกสถานะประจำวันแล้ว"],
    ["Retry", "ลองใหม่"],
    ["Loading leave statuses…", "กำลังโหลดข้อมูลการลา…"],
    ["Click a calendar day to assign or clear its HR status.", "คลิกวันที่ในปฏิทินเพื่อระบุหรือยกเลิกสถานะโดย HR"],
    ["Click a calendar day to view its HR status. HR manages changes.", "คลิกวันที่ในปฏิทินเพื่อดูสถานะประจำวัน HR เป็นผู้แก้ไขข้อมูล"],
    ["HR status does not replace clock-in/out records or automatically calculate pay.", "สถานะที่ HR ระบุไม่แทนที่เวลาเข้าและออกงาน และไม่คำนวณค่าจ้างโดยอัตโนมัติ"],
    ["Leave status is temporarily unavailable. Please contact your system administrator.", "ไม่สามารถโหลดสถานะการลาได้ในขณะนี้ กรุณาติดต่อผู้ดูแลระบบ"],
    ["Unable to save HR status. Please try again.", "บันทึกสถานะไม่ได้ กรุณาลองใหม่"],
    ["Unable to load HR status. Please close and try again.", "โหลดสถานะไม่ได้ กรุณาปิดหน้าต่างแล้วลองใหม่"],
    ["Another HR user changed this day. Close and reopen it to review the latest status.", "HR ท่านอื่นแก้ไขสถานะของวันนี้แล้ว กรุณาปิดแล้วเปิดใหม่เพื่อตรวจสอบสถานะล่าสุด"],
    ["Only HR or Super Admin can edit attendance classifications", "เฉพาะ HR หรือผู้ดูแลระบบสูงสุดเท่านั้นที่แก้ไขสถานะประจำวันได้"],
    ["HR note must be 500 characters or less", "หมายเหตุของ HR ต้องไม่เกิน 500 ตัวอักษร"],
    ["Employee not found", "ไม่พบพนักงาน"]
  );

  pairs.push(
    ["Employee registration", "ลงทะเบียนพนักงาน"],
    ["EMPLOYEE REGISTRATION", "ลงทะเบียนพนักงาน"],
    ["New employee? Register here", "พนักงานใหม่? ลงทะเบียนที่นี่"],
    ["Register as an employee", "ลงทะเบียนเป็นพนักงาน"],
    ["Submit your details for HR approval. Once approved, your name will appear on the attendance page.", "ส่งข้อมูลให้ฝ่ายบุคคลอนุมัติ เมื่ออนุมัติแล้ว ชื่อของคุณจะปรากฏในหน้าลงเวลา"],
    ["Preferred branch", "สาขาที่ต้องการ"],
    ["Already registered or cannot find your name? Please contact HR.", "ลงทะเบียนแล้วหรือไม่พบชื่อ? กรุณาติดต่อฝ่ายบุคคล"],
    ["Checking availability...", "กำลังตรวจสอบความพร้อม..."],
    ["Submit registration", "ส่งคำขอลงทะเบียน"],
    ["Submitting registration...", "กำลังส่งคำขอลงทะเบียน..."],
    ["REGISTRATION SUBMITTED", "ส่งคำขอลงทะเบียนแล้ว"],
    ["Waiting for HR approval", "รอฝ่ายบุคคลอนุมัติ"],
    ["Your details have been submitted. HR will assign your employee type and branch before you can clock in.", "ส่งข้อมูลแล้ว ฝ่ายบุคคลจะกำหนดประเภทพนักงานและสาขาก่อนเริ่มลงเวลาได้"],
    ["Employee registration will be available after the backend update. Please contact HR for now.", "ระบบลงทะเบียนจะพร้อมใช้งานหลังอัปเดตระบบ กรุณาติดต่อฝ่ายบุคคลในระหว่างนี้"],
    ["No branches are available. Please contact HR.", "ไม่มีสาขาที่พร้อมใช้งาน กรุณาติดต่อฝ่ายบุคคล"],
    ["Registration cannot set employee permissions, status or compensation", "การลงทะเบียนไม่สามารถกำหนดสิทธิ์ สถานะ หรือค่าตอบแทนได้"],
    ["Enter a valid Thai phone number", "กรุณากรอกเบอร์โทรศัพท์ไทยที่ถูกต้อง"],
    ["Choose an available branch", "กรุณาเลือกสาขาที่พร้อมใช้งาน"],
    ["This phone number is already registered. Please contact HR.", "เบอร์โทรศัพท์นี้ลงทะเบียนแล้ว กรุณาติดต่อฝ่ายบุคคล"],
    ["Invalid full name", "ชื่อและนามสกุลไม่ถูกต้อง"],
    ["Invalid nickname", "ชื่อเล่นไม่ถูกต้อง"],
    ["Invalid phone", "เบอร์โทรศัพท์ไม่ถูกต้อง"],
    ["Too many registrations. Please try again later.", "มีการลงทะเบียนจำนวนมาก กรุณาลองใหม่ภายหลัง"],
    ["Unable to submit registration", "ส่งคำขอลงทะเบียนไม่ได้"],
    ["Please try submitting the registration again", "กรุณาลองส่งคำขอลงทะเบียนอีกครั้ง"],
    ["Employee spreadsheet sync", "ซิงค์ข้อมูลพนักงานจากสเปรดชีต"],
    ["Sync missing employees", "ซิงค์พนักงานที่ตกหล่น"],
    ["Adds missing employee IDs from the Employees sheet every day at 12:00 PM Bangkok time. Existing employee records are preserved.", "เพิ่มรหัสพนักงานที่ตกหล่นจากชีต Employees ทุกวันเวลา 12:00 น. ตามเวลาประเทศไทย โดยคงข้อมูลพนักงานที่มีอยู่แล้ว"],
    ["Employee sync will be available after the backend update.", "ระบบซิงค์พนักงานจะพร้อมใช้งานหลังอัปเดตระบบ"],
    ["Syncing missing employees...", "กำลังซิงค์พนักงานที่ตกหล่น..."],
    ["The first employee sync has not run yet.", "ยังไม่เคยซิงค์ข้อมูลพนักงาน"],
    ["Imported", "เพิ่มแล้ว"],
    ["Already present", "มีอยู่แล้ว"],
    ["Skipped", "ข้าม"],
    ["Failed", "ล้มเหลว"],
    ["Rows needing review", "แถวที่ต้องตรวจสอบ"],
    ["Sheet row", "แถวในชีต"],
    ["Shows the first 50 skipped rows.", "แสดง 50 แถวแรกที่ถูกข้าม"],
    ["Employee sync complete", "ซิงค์ข้อมูลพนักงานเสร็จแล้ว"],
    ["Missing or invalid employee ID", "รหัสพนักงานหายไปหรือไม่ถูกต้อง"],
    ["Duplicate employee ID in sheet", "รหัสพนักงานซ้ำในชีต"],
    ["Missing or invalid name", "ชื่อหายไปหรือไม่ถูกต้อง"],
    ["Missing or invalid employee status", "สถานะพนักงานหายไปหรือไม่ถูกต้อง"],
    ["Some employee records could not be imported. Retry the sync.", "นำเข้าข้อมูลพนักงานบางรายการไม่ได้ กรุณาซิงค์อีกครั้ง"],
    ["An employee sync is already running. Please try again shortly.", "กำลังซิงค์ข้อมูลพนักงานอยู่ กรุณาลองใหม่อีกสักครู่"],
    ["Employees can register on the attendance page and wait for HR/Admin approval.", "พนักงานลงทะเบียนในหน้าลงเวลาและรอฝ่ายบุคคลหรือผู้ดูแลระบบอนุมัติได้"],
    ["HR/Admin reviews employee registrations. Dashboard accounts are separate management access.", "ฝ่ายบุคคลหรือผู้ดูแลระบบตรวจสอบการลงทะเบียนพนักงาน บัญชีแดชบอร์ดเป็นสิทธิ์สำหรับฝ่ายจัดการแยกต่างหาก"],
    ["This employee has already been reviewed", "พนักงานนี้ได้รับการตรวจสอบแล้ว"],
    ["Choose an employee type and assigned location", "กรุณาเลือกประเภทพนักงานและสาขาที่กำหนด"]
  );

  pairs.push(["Pending employee registrations","คำขอลงทะเบียนพนักงานรออนุมัติ"], ["Review details and assign an employee type and branch before approval.","ตรวจสอบข้อมูลและกำหนดประเภทพนักงานกับสาขาก่อนอนุมัติ"], ["The previous employee sync did not finish. Please retry the sync.","การซิงค์ข้อมูลพนักงานครั้งก่อนยังไม่เสร็จ กรุณาซิงค์อีกครั้ง"]);

  pairs.push(
    ["Bank account number", "เลขบัญชีธนาคาร"],
    ["Enter the account number only. Spaces and hyphens are allowed.", "กรอกเฉพาะเลขบัญชี เว้นวรรคหรือใส่ขีดคั่นได้"],
    ["Bank account entry will be available after the backend update. HR can add it later.", "กรอกบัญชีธนาคารได้หลังอัปเดตระบบ ฝ่ายบุคคลสามารถเพิ่มข้อมูลให้ภายหลังได้"],
    ["Invalid bank account number", "เลขบัญชีธนาคารไม่ถูกต้อง"],
    ["Enter a bank account number with 6 to 20 digits", "กรุณากรอกเลขบัญชีธนาคาร 6 ถึง 20 หลัก"]
  );

  const normalize = text => text.trim().replace(/\s+/g, " ");
  const enToTh = new Map();
  const thToEn = new Map();
  pairs.forEach(([en, th]) => {
    enToTh.set(normalize(en).toLowerCase(), th);
    if (!thToEn.has(normalize(th))) thToEn.set(normalize(th), en.trim());
  });
  const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthsTh = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const shortTh = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const shortEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fragments = [
    [/^(\d+) types selected$/i, n => `เลือก ${n} ประเภท`],
    [/^(\d+) days$/i, n => `${n} วัน`], [/^(\d+) pending$/i, n => `${n} รออนุมัติ`],
    [/^(\d+) without a check-in yet$/i, n => `${n} คนยังไม่ลงเวลาเข้างาน`],
    [/^Shift start \+ (\d+) min grace$/i, n => `เวลาเริ่มกะ + ผ่อนผัน ${n} นาที`],
    [/^(\d+) attendance logs$/i, n => `${n} รายการลงเวลา`], [/^(\d+) errors$/i, n => `${n} ข้อผิดพลาด`],
    [/^(\d+) employees with activity$/i, n => `${n} คนมีรายการลงเวลา`], [/^(\d+) logs$/i, n => `${n} รายการ`],
    [/^\/ (\d+) active employees$/i, n => `/ พนักงานที่ใช้งาน ${n} คน`], [/^([\d.]+%) with a check-in$/i, n => `${n} ลงเวลาเข้างานแล้ว`],
    [/^(\d+) no check-in recorded yet$/i, n => `${n} คนยังไม่พบเวลาเข้างาน`],
    [/^(\d+) late$/i, n => `มาสาย ${n}`], [/^(\d+) missing OUT$/i, n => `ไม่พบเวลาออกงาน ${n}`], [/^(\d+) notes$/i, n => `${n} หมายเหตุ`],
    [/^(\d+) late · (\d+) missing OUT$/i, (a,b) => `มาสาย ${a} · ไม่พบเวลาออกงาน ${b}`],
    [/^(\d+) of (\d+) recorded employee-days$/i, (a,b) => `${a} จาก ${b} วันลงเวลารวม`],
    [/^(\d+) of (\d+) shift-mapped check-ins$/i, (a,b) => `${a} จาก ${b} รายการที่มีเวลาเริ่มกะ`],
    [/^(\d+)[–-](\d+) of (\d+)$/, (a,b,c) => `${a}–${b} จาก ${c}`],
    [/^(\d+) synced$/i, n => `ซิงค์แล้ว ${n}`], [/^Showing the latest (\d+) errors in this period\.$/i, n => `แสดงข้อผิดพลาดล่าสุด ${n} รายการในช่วงนี้`],
    [/^Late (\d+) min$/i, n => `มาสาย ${n} นาที`], [/^Employee (.+) created$/, id => `สร้างพนักงาน ${id} แล้ว`],
    [/^(.+) access approved$/, role => `อนุมัติสิทธิ์ ${translate(role)} แล้ว`],
    [/^View record for (.+)$/, name => `ดูบันทึกของ ${name}`],
  ];
  let language = "th";
  try { const saved = localStorage.getItem(key); if (saved === "en" || saved === "th") language = saved; } catch { /* Use Thai when storage is unavailable. */ }
  document.documentElement.lang = language;
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  let observer;
  let queued = false;
  const titleSource = document.title;
  const protectedContent = "script, style, textarea, input, [data-no-translate], .employee-name, .employee-sub, .employee-meta, #selectedName, #selectedMeta, #employeeReady.good strong, #drawerTitle, .record-person, .exception-person, .payroll-person, .sync-record-main strong, .mobile-account > strong, .mobile-account > span:first-of-type, #duplicateMessage strong, .upload-card strong, .table td:first-child:not([colspan]), .table tr:has(.accessEdit) td:nth-child(4), .account-record .info-value";

  function translate(source) {
    const text = normalize(source);
    if (!text) return source;
    const exact = language === "th" ? enToTh.get(text.toLowerCase()) : thToEn.get(text);
    if (exact) return exact;
    if (language === "en") {
      const count = text.match(/^(\d+) คน$/);
      if (count) return `${count[1]} employees`;
      const ready = text.match(/^พร้อม · ±(\d+)m$/);
      if (ready) return `Ready · ±${ready[1]}m`;
      const saved = text.match(/^(.+) · (เข้างาน|ออกงาน)$/);
      if (saved) return `${saved[1]} · ${saved[2] === "เข้างาน" ? "Clock in" : "Clock out"}`;
      const uploadError = text.match(/^บันทึกเวลาแล้ว แต่ข้อมูลเสริมอัปโหลดไม่สำเร็จ: (.+)$/);
      if (uploadError) return `Attendance saved, but the additional data upload failed: ${uploadError[1]}`;
      let dated = text.replace(/(\d{1,2})\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s+(\d{4})/g, (_,day,month,year) => `${day} ${shortEn[shortTh.indexOf(month)]} ${Number(year)-543}`);
      if (dated !== text) return dated;
      return source;
    }
    for (const [pattern, render] of fragments) {
      const match = text.match(pattern);
      if (match) return render(...match.slice(1));
    }
    let match = text.match(/^Step ([123])$/i); if (match) return `ขั้นตอนที่ ${match[1]}`;
    match = text.match(/^Updated (.+)$/); if (match) return `อัปเดต ${match[1]}`;
    match = text.match(/^Online · (.+)$/); if (match) return `เชื่อมต่อแล้ว · ${match[1]}`;
    match = text.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/);
    if (match) return `${monthsTh[monthsEn.indexOf(match[1])]} ${Number(match[2])+543}`;
    match = text.match(/^(.+) pagination$/); if (match) return `เปลี่ยนหน้ารายการ${translate(match[1])}`;
    match = text.match(/^(\d{4}-\d{2}-\d{2}) · (.+?)( · IN .+)?( · OUT .+)?$/);
    if (match) return `${match[1]} · ${translate(match[2])}${(match[3] || "").replace("IN", "เข้างาน")}${(match[4] || "").replace("OUT", "ออกงาน")}`;
    match = text.match(/^(.+) · (เข้างาน|ออกงาน)$/); if (match) return source;
    if (text === "employees") return "คน";
    if (text.startsWith("Payroll calendar could not load: ")) return text.replace("Payroll calendar could not load: ", "โหลดปฏิทินลงเวลาไม่ได้: ");
    return source;
  }

  function updateText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(protectedContent)) return;
    // Approval and access dialogs contain a person's identity; the add-employee dialog contains UI copy.
    if (parent.matches("#actionModalContent > h2, #actionModalContent > p") && !document.getElementById("newEmpName")) return;
    const current = node.nodeValue;
    let record = textSources.get(node);
    if (!record || current !== record.output) record = { source: current, output: current };
    // Options without an explicit value must keep their operational value when their label changes.
    if (parent.tagName === "OPTION" && !parent.hasAttribute("value")) parent.value = parent.textContent;
    let result = translate(record.source);
    if (parent.id === "dateText") {
      result = new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());
    }
    const whitespace = record.source.match(/^(\s*)[\s\S]*?(\s*)$/);
    record.output = result === record.source ? record.source : whitespace[1] + result.trim() + whitespace[2];
    textSources.set(node, record);
    if (node.nodeValue !== record.output) node.nodeValue = record.output;
  }

  function updateAttributes(element) {
    if (element.closest("[data-no-translate]")) return;
    let records = attributeSources.get(element);
    if (!records) { records = {}; attributeSources.set(element, records); }
    ["placeholder", "aria-label", "title", "alt"].forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      let record = records[attribute];
      if (!record || record.output !== current) record = { source: current, output: current };
      record.output = translate(record.source);
      records[attribute] = record;
      if (record.output !== current) element.setAttribute(attribute, record.output);
    });
  }

  function createControl(id) {
    const label = document.createElement("label");
    label.className = "language-control";
    label.htmlFor = id;
    label.innerHTML = `<span>Language</span><select id="${id}" data-language aria-label="Language / ภาษา"><option value="th" data-no-translate>ไทย</option><option value="en" data-no-translate>English</option></select>`;
    return label;
  }

  function mountControls() {
    const header = document.querySelector(".header-actions, .dash-topbar > .toolbar-group, .auth-display-controls");
    if (header && !header.querySelector("select[data-language]")) {
      const textSize = header.querySelector(".text-size-control");
      if (textSize) textSize.after(createControl("site-language"));
      else header.prepend(createControl("site-language"));
    }
    const menu = document.querySelector(".mobile-menu");
    if (menu && !menu.querySelector("select[data-language]")) {
      const textSize = menu.querySelector(".text-size-control");
      if (textSize) textSize.after(createControl("mobile-language"));
      else menu.append(createControl("mobile-language"));
    }
    document.querySelectorAll("select[data-language]").forEach(control => { control.value = language; });
  }

  function render() {
    if (!document.body) return;
    observer?.disconnect();
    mountControls();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) updateText(walker.currentNode);
    document.querySelectorAll("[placeholder], [aria-label], [title], [alt]").forEach(updateAttributes);
    document.title = translate(titleSource);
    document.documentElement.lang = language;
    observer?.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title", "alt", "class"] });
    queued = false;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(render);
  }

  function setLanguage(value, persist = true) {
    language = value === "en" ? "en" : "th";
    if (persist) { try { localStorage.setItem(key, language); } catch { /* Switching still works without storage. */ } }
    render();
  }

  document.addEventListener("DOMContentLoaded", () => { observer = new MutationObserver(schedule); render(); });
  document.addEventListener("change", event => { if (event.target.matches("select[data-language]")) setLanguage(event.target.value); });
  // Include the language and text-size selects in the existing mobile dialog's keyboard loop.
  document.addEventListener("keydown", event => {
    const menu = document.getElementById("mobileMenu");
    if (event.key !== "Tab" || !menu || menu.hidden) return;
    const controls = Array.from(menu.querySelectorAll("button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href], [tabindex='0']")).filter(control => control.getClientRects().length);
    if (!controls.length) return;
    event.stopImmediatePropagation();
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);
  window.addEventListener("storage", event => { if (event.key === key) setLanguage(event.newValue, false); });
  window.SSSLanguage = { translate, language: () => language, setLanguage };
})();
