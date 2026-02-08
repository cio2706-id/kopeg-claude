-- ============================================================================
-- import-simpanan.sql
-- Auto-generated on 2026-02-08T06:56:38.591Z
-- Source: Simpanan_Koperasi_2024.xlsx  (636 members)
--
-- IMPORTANT: Run create-auth-users.ts FIRST to create Supabase Auth users,
-- then run this SQL to insert into users + savings tables.
--
-- This script uses a DO block so auth_id lookups happen at execution time.
-- Auth users must already exist in auth.users with the matching email.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Insert into "users" table
-- We look up auth_id from auth.users by email. If auth user doesn't exist
-- yet, this will fail – run create-auth-users.ts first.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO users (auth_id, email, full_name, role, employee_id, department, is_active)
VALUES
  (
    (SELECT id::text FROM auth.users WHERE email = '000001@kopeg-bki.id'),
    '000001@kopeg-bki.id',
    'Aan Agus F, Amd.',
    'member',
    '000001',
    'SBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000006@kopeg-bki.id'),
    '000006@kopeg-bki.id',
    'Abu Kasim Usman',
    'member',
    '000006',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000009@kopeg-bki.id'),
    '000009@kopeg-bki.id',
    'Achmad',
    'member',
    '000009',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000013@kopeg-bki.id'),
    '000013@kopeg-bki.id',
    'Achmad Muslim, Ir',
    'member',
    '000013',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000014@kopeg-bki.id'),
    '000014@kopeg-bki.id',
    'Achmad Suseno, Ir',
    'member',
    '000014',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000015@kopeg-bki.id'),
    '000015@kopeg-bki.id',
    'Achmad Tawakkal',
    'member',
    '000015',
    'DOC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000018@kopeg-bki.id'),
    '000018@kopeg-bki.id',
    'Ade Prihadi',
    'member',
    '000018',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000019@kopeg-bki.id'),
    '000019@kopeg-bki.id',
    'Ade Sugandi',
    'member',
    '000019',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000020@kopeg-bki.id'),
    '000020@kopeg-bki.id',
    'Adhitama Rama, ST.',
    'member',
    '000020',
    'PHP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000025@kopeg-bki.id'),
    '000025@kopeg-bki.id',
    'Aditia Warman',
    'member',
    '000025',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000026@kopeg-bki.id'),
    '000026@kopeg-bki.id',
    'Aditya Trisandriya P, ST',
    'member',
    '000026',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000027@kopeg-bki.id'),
    '000027@kopeg-bki.id',
    'Afrizal',
    'member',
    '000027',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000030@kopeg-bki.id'),
    '000030@kopeg-bki.id',
    'Agung Prihanto, Ir',
    'member',
    '000030',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000032@kopeg-bki.id'),
    '000032@kopeg-bki.id',
    'Agus Siswoko  Ir',
    'member',
    '000032',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000033@kopeg-bki.id'),
    '000033@kopeg-bki.id',
    'Agus Salim, Ir',
    'member',
    '000033',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000037@kopeg-bki.id'),
    '000037@kopeg-bki.id',
    'Agustang, ST',
    'member',
    '000037',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000043@kopeg-bki.id'),
    '000043@kopeg-bki.id',
    'Ahmad Sariful Anwar, ST.',
    'member',
    '000043',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000044@kopeg-bki.id'),
    '000044@kopeg-bki.id',
    'Ahmad Yunus',
    'member',
    '000044',
    'PU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000045@kopeg-bki.id'),
    '000045@kopeg-bki.id',
    'Ahmad Zakky. ST',
    'member',
    '000045',
    'MHC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000048@kopeg-bki.id'),
    '000048@kopeg-bki.id',
    'Akhmad Muliaddin',
    'member',
    '000048',
    'PBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000052@kopeg-bki.id'),
    '000052@kopeg-bki.id',
    'Alfonsus Susilarso, AMK-C',
    'member',
    '000052',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000053@kopeg-bki.id'),
    '000053@kopeg-bki.id',
    'Ali Akbar Baso, S.T.',
    'member',
    '000053',
    'TP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000056@kopeg-bki.id'),
    '000056@kopeg-bki.id',
    'Alim Saadi, Ir',
    'member',
    '000056',
    'R&P',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000059@kopeg-bki.id'),
    '000059@kopeg-bki.id',
    'Andi Ardi Abdullah. ST',
    'member',
    '000059',
    'MKSC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000060@kopeg-bki.id'),
    '000060@kopeg-bki.id',
    'Andi Arman, ST.',
    'member',
    '000060',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000062@kopeg-bki.id'),
    '000062@kopeg-bki.id',
    'Andi Lama Passesu',
    'member',
    '000062',
    'PSMMO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000064@kopeg-bki.id'),
    '000064@kopeg-bki.id',
    'Andi Nur Alim Kamal. ST',
    'member',
    '000064',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000065@kopeg-bki.id'),
    '000065@kopeg-bki.id',
    'Andi P. Siagian . ST',
    'member',
    '000065',
    'BN',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000067@kopeg-bki.id'),
    '000067@kopeg-bki.id',
    'Andri Suryawan, SH.',
    'member',
    '000067',
    'LC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000070@kopeg-bki.id'),
    '000070@kopeg-bki.id',
    'Anita Magdalena, SH',
    'member',
    '000070',
    'SPI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000071@kopeg-bki.id'),
    '000071@kopeg-bki.id',
    'Anogi Akbar Ali, SE',
    'member',
    '000071',
    'PSMMO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000072@kopeg-bki.id'),
    '000072@kopeg-bki.id',
    'Antong Goli, ST',
    'member',
    '000072',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000075@kopeg-bki.id'),
    '000075@kopeg-bki.id',
    'Aquarius Setiawan, ST',
    'member',
    '000075',
    'SBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000076@kopeg-bki.id'),
    '000076@kopeg-bki.id',
    'Ardhian Budi S.',
    'member',
    '000076',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000081@kopeg-bki.id'),
    '000081@kopeg-bki.id',
    'Arief Budi Permana, Ir',
    'member',
    '000081',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000083@kopeg-bki.id'),
    '000083@kopeg-bki.id',
    'Arief Nurtjahjo, Ir',
    'member',
    '000083',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000084@kopeg-bki.id'),
    '000084@kopeg-bki.id',
    'Arief Rachman',
    'member',
    '000084',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000085@kopeg-bki.id'),
    '000085@kopeg-bki.id',
    'Arief Sofyan',
    'member',
    '000085',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000086@kopeg-bki.id'),
    '000086@kopeg-bki.id',
    'Arief Sulistiono, Ir',
    'member',
    '000086',
    'BJ',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000088@kopeg-bki.id'),
    '000088@kopeg-bki.id',
    'Arif Bijaksana Satria N, ST.',
    'member',
    '000088',
    'BMC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000089@kopeg-bki.id'),
    '000089@kopeg-bki.id',
    'Arif Purwono, ST',
    'member',
    '000089',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000091@kopeg-bki.id'),
    '000091@kopeg-bki.id',
    'Arif Yunaedi, M.Sc.',
    'member',
    '000091',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000094@kopeg-bki.id'),
    '000094@kopeg-bki.id',
    'Arifuddin  ST',
    'member',
    '000094',
    'CG',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000095@kopeg-bki.id'),
    '000095@kopeg-bki.id',
    'Aris Susanto',
    'member',
    '000095',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000096@kopeg-bki.id'),
    '000096@kopeg-bki.id',
    'Armindary Arief. ST',
    'member',
    '000096',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000097@kopeg-bki.id'),
    '000097@kopeg-bki.id',
    'Arsalnan Latif, Ir',
    'member',
    '000097',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000099@kopeg-bki.id'),
    '000099@kopeg-bki.id',
    'Aryo Singgih, M.Mar.E',
    'member',
    '000099',
    'BT',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000100@kopeg-bki.id'),
    '000100@kopeg-bki.id',
    'Asep Supriatna',
    'member',
    '000100',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000101@kopeg-bki.id'),
    '000101@kopeg-bki.id',
    'Asep Sutrisna S, SH, MM',
    'member',
    '000101',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000103@kopeg-bki.id'),
    '000103@kopeg-bki.id',
    'Atjeh Nahan, Ing.',
    'member',
    '000103',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000111@kopeg-bki.id'),
    '000111@kopeg-bki.id',
    'Azwar Firly',
    'member',
    '000111',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000112@kopeg-bki.id'),
    '000112@kopeg-bki.id',
    'Bagyono',
    'member',
    '000112',
    'SB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000114@kopeg-bki.id'),
    '000114@kopeg-bki.id',
    'Bakir',
    'member',
    '000114',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000116@kopeg-bki.id'),
    '000116@kopeg-bki.id',
    'Bambang Hariyadi',
    'member',
    '000116',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000117@kopeg-bki.id'),
    '000117@kopeg-bki.id',
    'Bambang Irwan',
    'member',
    '000117',
    'CG',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000119@kopeg-bki.id'),
    '000119@kopeg-bki.id',
    'Bambang Riyanto, Ir',
    'member',
    '000119',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000120@kopeg-bki.id'),
    '000120@kopeg-bki.id',
    'Bambang Sugiono',
    'member',
    '000120',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000121@kopeg-bki.id'),
    '000121@kopeg-bki.id',
    'Bambang Sutomo, Ir',
    'member',
    '000121',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000122@kopeg-bki.id'),
    '000122@kopeg-bki.id',
    'Bambang Tri Suharto, Ir',
    'member',
    '000122',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000123@kopeg-bki.id'),
    '000123@kopeg-bki.id',
    'Bambang Wardoyo',
    'member',
    '000123',
    'BJ',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000124@kopeg-bki.id'),
    '000124@kopeg-bki.id',
    'Bambang Wijanarko.',
    'member',
    '000124',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000125@kopeg-bki.id'),
    '000125@kopeg-bki.id',
    'Bawa Prasetyo, ST.',
    'member',
    '000125',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000126@kopeg-bki.id'),
    '000126@kopeg-bki.id',
    'Benny Hermawan, Ir',
    'member',
    '000126',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000127@kopeg-bki.id'),
    '000127@kopeg-bki.id',
    'Benny Hosbrantas, Drs',
    'member',
    '000127',
    'BP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000128@kopeg-bki.id'),
    '000128@kopeg-bki.id',
    'Berman Simarmata, Amd',
    'member',
    '000128',
    'BMC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000129@kopeg-bki.id'),
    '000129@kopeg-bki.id',
    'Bogi Akhmad Suendar',
    'member',
    '000129',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000130@kopeg-bki.id'),
    '000130@kopeg-bki.id',
    'Budi Isrofi, Ir',
    'member',
    '000130',
    'BM',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000131@kopeg-bki.id'),
    '000131@kopeg-bki.id',
    'Budi Prakoso, Ir',
    'member',
    '000131',
    'RKRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000133@kopeg-bki.id'),
    '000133@kopeg-bki.id',
    'Budi Setiawan',
    'member',
    '000133',
    'PU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000135@kopeg-bki.id'),
    '000135@kopeg-bki.id',
    'Budiman Johansyah, S.T',
    'member',
    '000135',
    'BPC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000136@kopeg-bki.id'),
    '000136@kopeg-bki.id',
    'Burhanuddin',
    'member',
    '000136',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000139@kopeg-bki.id'),
    '000139@kopeg-bki.id',
    'Catur Achiryanto. St',
    'member',
    '000139',
    'MHC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000141@kopeg-bki.id'),
    '000141@kopeg-bki.id',
    'Chalis Umar, Ir.',
    'member',
    '000141',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000142@kopeg-bki.id'),
    '000142@kopeg-bki.id',
    'Dachlius',
    'member',
    '000142',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000143@kopeg-bki.id'),
    '000143@kopeg-bki.id',
    'Dandy Rukmana, SE',
    'member',
    '000143',
    'ACD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000144@kopeg-bki.id'),
    '000144@kopeg-bki.id',
    'Dani Maulana. ST',
    'member',
    '000144',
    'SM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000145@kopeg-bki.id'),
    '000145@kopeg-bki.id',
    'Darma Toding',
    'member',
    '000145',
    'BT',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000148@kopeg-bki.id'),
    '000148@kopeg-bki.id',
    'David Noer Syuhada, Ir',
    'member',
    '000148',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000149@kopeg-bki.id'),
    '000149@kopeg-bki.id',
    'Dede Ma''mun, SE',
    'member',
    '000149',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000150@kopeg-bki.id'),
    '000150@kopeg-bki.id',
    'Dede Nanda S, ST',
    'member',
    '000150',
    'SD',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000152@kopeg-bki.id'),
    '000152@kopeg-bki.id',
    'Dedy Haryadi',
    'member',
    '000152',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000153@kopeg-bki.id'),
    '000153@kopeg-bki.id',
    'Defri Sumarwan, ST',
    'member',
    '000153',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000156@kopeg-bki.id'),
    '000156@kopeg-bki.id',
    'Dermawan',
    'member',
    '000156',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000157@kopeg-bki.id'),
    '000157@kopeg-bki.id',
    'Desi Hardianawati',
    'member',
    '000157',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000160@kopeg-bki.id'),
    '000160@kopeg-bki.id',
    'Didi Kurniadi, Ir',
    'member',
    '000160',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000162@kopeg-bki.id'),
    '000162@kopeg-bki.id',
    'Diding Suwandi, Ir',
    'member',
    '000162',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000163@kopeg-bki.id'),
    '000163@kopeg-bki.id',
    'Didiet E Firmansyah.',
    'member',
    '000163',
    'ISPB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000164@kopeg-bki.id'),
    '000164@kopeg-bki.id',
    'Dino Vito Larasanto',
    'member',
    '000164',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000165@kopeg-bki.id'),
    '000165@kopeg-bki.id',
    'Dismir Abdoh',
    'member',
    '000165',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000166@kopeg-bki.id'),
    '000166@kopeg-bki.id',
    'Djoko Wahyudi. Ir',
    'member',
    '000166',
    'SR',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000167@kopeg-bki.id'),
    '000167@kopeg-bki.id',
    'Doan Oskar Dewandaru. Ir',
    'member',
    '000167',
    'AB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000168@kopeg-bki.id'),
    '000168@kopeg-bki.id',
    'Dody Setiawan',
    'member',
    '000168',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000169@kopeg-bki.id'),
    '000169@kopeg-bki.id',
    'Donny S. Purba. Drs',
    'member',
    '000169',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000170@kopeg-bki.id'),
    '000170@kopeg-bki.id',
    'Donny Trisusilo, Ir',
    'member',
    '000170',
    'PR',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000172@kopeg-bki.id'),
    '000172@kopeg-bki.id',
    'Dwiana Galuh L. ST',
    'member',
    '000172',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000175@kopeg-bki.id'),
    '000175@kopeg-bki.id',
    'Edwin Olaf J.D ST',
    'member',
    '000175',
    'CG',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000178@kopeg-bki.id'),
    '000178@kopeg-bki.id',
    'Edy Sutrisno, Ir',
    'member',
    '000178',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000179@kopeg-bki.id'),
    '000179@kopeg-bki.id',
    'Eka Yuni Ermawati',
    'member',
    '000179',
    'ST',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000180@kopeg-bki.id'),
    '000180@kopeg-bki.id',
    'Eko Buana Putra',
    'member',
    '000180',
    'BN',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000181@kopeg-bki.id'),
    '000181@kopeg-bki.id',
    'Elis Rosida',
    'member',
    '000181',
    'PKK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000183@kopeg-bki.id'),
    '000183@kopeg-bki.id',
    'Elva Moch. Ramdhani',
    'member',
    '000183',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000184@kopeg-bki.id'),
    '000184@kopeg-bki.id',
    'Endah Mustika Ningtyas',
    'member',
    '000184',
    'TJSL',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000187@kopeg-bki.id'),
    '000187@kopeg-bki.id',
    'Endang W',
    'member',
    '000187',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000191@kopeg-bki.id'),
    '000191@kopeg-bki.id',
    'Erlini Agung, SE',
    'member',
    '000191',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000192@kopeg-bki.id'),
    '000192@kopeg-bki.id',
    'Erry Sanjaya Djayus',
    'member',
    '000192',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000194@kopeg-bki.id'),
    '000194@kopeg-bki.id',
    'Erwin, Ir',
    'member',
    '000194',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000195@kopeg-bki.id'),
    '000195@kopeg-bki.id',
    'Ery Dani Sampurno, Ir',
    'member',
    '000195',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000196@kopeg-bki.id'),
    '000196@kopeg-bki.id',
    'Efa Rosida Dwi Aditirta',
    'member',
    '000196',
    'DOK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000197@kopeg-bki.id'),
    '000197@kopeg-bki.id',
    'Eva Sintauli Saragih, SE',
    'member',
    '000197',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000198@kopeg-bki.id'),
    '000198@kopeg-bki.id',
    'Fahmi ST',
    'member',
    '000198',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000199@kopeg-bki.id'),
    '000199@kopeg-bki.id',
    'Fajar Nugraha, Ir',
    'member',
    '000199',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000203@kopeg-bki.id'),
    '000203@kopeg-bki.id',
    'Farrah Mutia. N',
    'member',
    '000203',
    'TI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000205@kopeg-bki.id'),
    '000205@kopeg-bki.id',
    'Fauzi Akbar Nasution, ST',
    'member',
    '000205',
    'CN',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000206@kopeg-bki.id'),
    '000206@kopeg-bki.id',
    'Febriansyah',
    'member',
    '000206',
    'AB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000207@kopeg-bki.id'),
    '000207@kopeg-bki.id',
    'Fernando, Ir',
    'member',
    '000207',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000208@kopeg-bki.id'),
    '000208@kopeg-bki.id',
    'Ferry Harfianto',
    'member',
    '000208',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000210@kopeg-bki.id'),
    '000210@kopeg-bki.id',
    'Fikrah Wathani',
    'member',
    '000210',
    'HCS',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000211@kopeg-bki.id'),
    '000211@kopeg-bki.id',
    'Firmansyah',
    'member',
    '000211',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000212@kopeg-bki.id'),
    '000212@kopeg-bki.id',
    'Fredhi Agung. P Ir',
    'member',
    '000212',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000213@kopeg-bki.id'),
    '000213@kopeg-bki.id',
    'Guruh M. Amal. ST',
    'member',
    '000213',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000216@kopeg-bki.id'),
    '000216@kopeg-bki.id',
    'Haeruddin',
    'member',
    '000216',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000217@kopeg-bki.id'),
    '000217@kopeg-bki.id',
    'Hambali Wahid',
    'member',
    '000217',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000219@kopeg-bki.id'),
    '000219@kopeg-bki.id',
    'Hardi E.P. Siagian. ST',
    'member',
    '000219',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000222@kopeg-bki.id'),
    '000222@kopeg-bki.id',
    'Harrys Pahala',
    'member',
    '000222',
    'DOC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000223@kopeg-bki.id'),
    '000223@kopeg-bki.id',
    'Harusia Ismail',
    'member',
    '000223',
    'MKS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000225@kopeg-bki.id'),
    '000225@kopeg-bki.id',
    'Heintje Angganois, Ir',
    'member',
    '000225',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000227@kopeg-bki.id'),
    '000227@kopeg-bki.id',
    'Hendra Bagus, K, M.Mer',
    'member',
    '000227',
    'SB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000230@kopeg-bki.id'),
    '000230@kopeg-bki.id',
    'Hendry Daniel',
    'member',
    '000230',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000232@kopeg-bki.id'),
    '000232@kopeg-bki.id',
    'Herawati , S',
    'member',
    '000232',
    'DOC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000233@kopeg-bki.id'),
    '000233@kopeg-bki.id',
    'Herbert SH, Ir',
    'member',
    '000233',
    'M&K',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000234@kopeg-bki.id'),
    '000234@kopeg-bki.id',
    'Herdiman Mustari. ST',
    'member',
    '000234',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000235@kopeg-bki.id'),
    '000235@kopeg-bki.id',
    'Heri Siswanto, ST',
    'member',
    '000235',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000236@kopeg-bki.id'),
    '000236@kopeg-bki.id',
    'Heri Wirawan, ST.',
    'member',
    '000236',
    'BNC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000239@kopeg-bki.id'),
    '000239@kopeg-bki.id',
    'Herry Sudradjat, SH',
    'member',
    '000239',
    'DMH',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000240@kopeg-bki.id'),
    '000240@kopeg-bki.id',
    'Heru Susilo Budiman, Ir',
    'member',
    '000240',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000242@kopeg-bki.id'),
    '000242@kopeg-bki.id',
    'Hijrawati Muchtar ST',
    'member',
    '000242',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000243@kopeg-bki.id'),
    '000243@kopeg-bki.id',
    'Himawan',
    'member',
    '000243',
    'M&K',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000249@kopeg-bki.id'),
    '000249@kopeg-bki.id',
    'Ilham Syahrir, ST',
    'member',
    '000249',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000250@kopeg-bki.id'),
    '000250@kopeg-bki.id',
    'Ilyas',
    'member',
    '000250',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000251@kopeg-bki.id'),
    '000251@kopeg-bki.id',
    'Ilyas Dangkeng',
    'member',
    '000251',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000254@kopeg-bki.id'),
    '000254@kopeg-bki.id',
    'Imam Suhadi, BE',
    'member',
    '000254',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000255@kopeg-bki.id'),
    '000255@kopeg-bki.id',
    'Imran',
    'member',
    '000255',
    'SR',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000256@kopeg-bki.id'),
    '000256@kopeg-bki.id',
    'Indra Kusuma',
    'member',
    '000256',
    'CG',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000257@kopeg-bki.id'),
    '000257@kopeg-bki.id',
    'Indra Permana',
    'member',
    '000257',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000258@kopeg-bki.id'),
    '000258@kopeg-bki.id',
    'ING Arimbawa, Ir',
    'member',
    '000258',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000259@kopeg-bki.id'),
    '000259@kopeg-bki.id',
    'Iqbal fikri. ir',
    'member',
    '000259',
    'SEKPER',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000263@kopeg-bki.id'),
    '000263@kopeg-bki.id',
    'Irwan Eko Santoso, ST',
    'member',
    '000263',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000264@kopeg-bki.id'),
    '000264@kopeg-bki.id',
    'Irwanto, B.Sc.',
    'member',
    '000264',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000265@kopeg-bki.id'),
    '000265@kopeg-bki.id',
    'Irzan Azis. ST',
    'member',
    '000265',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000266@kopeg-bki.id'),
    '000266@kopeg-bki.id',
    'Is Supriati',
    'member',
    '000266',
    'BP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000268@kopeg-bki.id'),
    '000268@kopeg-bki.id',
    'Jamaluddin Gani, Drs',
    'member',
    '000268',
    'MRKU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000270@kopeg-bki.id'),
    '000270@kopeg-bki.id',
    'Jesse SR Tarigan',
    'member',
    '000270',
    'BMC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000276@kopeg-bki.id'),
    '000276@kopeg-bki.id',
    'Jonas Tahia. Ir',
    'member',
    '000276',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000277@kopeg-bki.id'),
    '000277@kopeg-bki.id',
    'Joustra Billy, ST.',
    'member',
    '000277',
    'SR',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000279@kopeg-bki.id'),
    '000279@kopeg-bki.id',
    'Juto Yuwono, Amd.',
    'member',
    '000279',
    'PRC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000283@kopeg-bki.id'),
    '000283@kopeg-bki.id',
    'Kartika Wijayanti',
    'member',
    '000283',
    'PSMMO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000285@kopeg-bki.id'),
    '000285@kopeg-bki.id',
    'Khusaini',
    'member',
    '000285',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000289@kopeg-bki.id'),
    '000289@kopeg-bki.id',
    'Kokok Yudha Cahyono, ST',
    'member',
    '000289',
    'SD',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000291@kopeg-bki.id'),
    '000291@kopeg-bki.id',
    'Kosim Bin Mari',
    'member',
    '000291',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000292@kopeg-bki.id'),
    '000292@kopeg-bki.id',
    'Krishna Wijayadi',
    'member',
    '000292',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000298@kopeg-bki.id'),
    '000298@kopeg-bki.id',
    'Lilah Kurnia Sari, ST',
    'member',
    '000298',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000299@kopeg-bki.id'),
    '000299@kopeg-bki.id',
    'Lily Pandansari',
    'member',
    '000299',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000300@kopeg-bki.id'),
    '000300@kopeg-bki.id',
    'Linda Kurniaty',
    'member',
    '000300',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000302@kopeg-bki.id'),
    '000302@kopeg-bki.id',
    'Lisa',
    'member',
    '000302',
    'PR',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000304@kopeg-bki.id'),
    '000304@kopeg-bki.id',
    'Liza Yuni. ST',
    'member',
    '000304',
    'PSMMO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000305@kopeg-bki.id'),
    '000305@kopeg-bki.id',
    'Lukman Hakim. Ir',
    'member',
    '000305',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000307@kopeg-bki.id'),
    '000307@kopeg-bki.id',
    'M. Arif Kurniawan',
    'member',
    '000307',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000308@kopeg-bki.id'),
    '000308@kopeg-bki.id',
    'M. Arif Maulana Wiranegar',
    'member',
    '000308',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000309@kopeg-bki.id'),
    '000309@kopeg-bki.id',
    'Muh Aspar',
    'member',
    '000309',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000310@kopeg-bki.id'),
    '000310@kopeg-bki.id',
    'M. Basarudin Aspahani, Ir',
    'member',
    '000310',
    'M&K',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000312@kopeg-bki.id'),
    '000312@kopeg-bki.id',
    'M. Iqbal, ST',
    'member',
    '000312',
    'PRC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000315@kopeg-bki.id'),
    '000315@kopeg-bki.id',
    'M. Natzir',
    'member',
    '000315',
    'SB/2',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000317@kopeg-bki.id'),
    '000317@kopeg-bki.id',
    'M. Nur Ardam',
    'member',
    '000317',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000321@kopeg-bki.id'),
    '000321@kopeg-bki.id',
    'Mahmur Mochtar, ST',
    'member',
    '000321',
    'MKSC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000322@kopeg-bki.id'),
    '000322@kopeg-bki.id',
    'Mamin Rifia. St',
    'member',
    '000322',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000323@kopeg-bki.id'),
    '000323@kopeg-bki.id',
    'Manahan. P. Sihombing',
    'member',
    '000323',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000324@kopeg-bki.id'),
    '000324@kopeg-bki.id',
    'Manggarseta Jatnika, Ir',
    'member',
    '000324',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000327@kopeg-bki.id'),
    '000327@kopeg-bki.id',
    'Mardiana Muchtar',
    'member',
    '000327',
    'BPC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000329@kopeg-bki.id'),
    '000329@kopeg-bki.id',
    'Mardini Embun Sari',
    'member',
    '000329',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000331@kopeg-bki.id'),
    '000331@kopeg-bki.id',
    'Marina Arifianti',
    'member',
    '000331',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000333@kopeg-bki.id'),
    '000333@kopeg-bki.id',
    'Marthen Tonis',
    'member',
    '000333',
    'SB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000334@kopeg-bki.id'),
    '000334@kopeg-bki.id',
    'Martono, ST',
    'member',
    '000334',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000336@kopeg-bki.id'),
    '000336@kopeg-bki.id',
    'Maskarena Johanis',
    'member',
    '000336',
    'BT',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000337@kopeg-bki.id'),
    '000337@kopeg-bki.id',
    'Ma''sum, Ir',
    'member',
    '000337',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000338@kopeg-bki.id'),
    '000338@kopeg-bki.id',
    'Mat Hasan',
    'member',
    '000338',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000340@kopeg-bki.id'),
    '000340@kopeg-bki.id',
    'Merdiansah',
    'member',
    '000340',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000341@kopeg-bki.id'),
    '000341@kopeg-bki.id',
    'Mia Martina Indah',
    'member',
    '000341',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000342@kopeg-bki.id'),
    '000342@kopeg-bki.id',
    'Miftah Faridy, ST',
    'member',
    '000342',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000345@kopeg-bki.id'),
    '000345@kopeg-bki.id',
    'Misbahudin Aidy, Ir',
    'member',
    '000345',
    'SEKPER',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000348@kopeg-bki.id'),
    '000348@kopeg-bki.id',
    'Moch. Zaky, ST.',
    'member',
    '000348',
    'RP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000351@kopeg-bki.id'),
    '000351@kopeg-bki.id',
    'Moh. Furqon, ST.',
    'member',
    '000351',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000352@kopeg-bki.id'),
    '000352@kopeg-bki.id',
    'Moh. Mukhtar',
    'member',
    '000352',
    'PB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000353@kopeg-bki.id'),
    '000353@kopeg-bki.id',
    'Moh. Rico Faridz, Ir',
    'member',
    '000353',
    'IT',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000354@kopeg-bki.id'),
    '000354@kopeg-bki.id',
    'Moh. Sugeng, Ir',
    'member',
    '000354',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000362@kopeg-bki.id'),
    '000362@kopeg-bki.id',
    'Muh. Arfah, Ir',
    'member',
    '000362',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000363@kopeg-bki.id'),
    '000363@kopeg-bki.id',
    'Muh. Fajrin M. Said ST',
    'member',
    '000363',
    'MKS',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000364@kopeg-bki.id'),
    '000364@kopeg-bki.id',
    'Muh. Idi, Ir',
    'member',
    '000364',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000365@kopeg-bki.id'),
    '000365@kopeg-bki.id',
    'Muh. Nasir, ST.',
    'member',
    '000365',
    'SBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000366@kopeg-bki.id'),
    '000366@kopeg-bki.id',
    'Muh. Saefuddin',
    'member',
    '000366',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000367@kopeg-bki.id'),
    '000367@kopeg-bki.id',
    'Muh. Sodik ST',
    'member',
    '000367',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000369@kopeg-bki.id'),
    '000369@kopeg-bki.id',
    'Muhammad Abdul Malik, ST.',
    'member',
    '000369',
    'RP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000370@kopeg-bki.id'),
    '000370@kopeg-bki.id',
    'Muhammad Ichsan. ST',
    'member',
    '000370',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000376@kopeg-bki.id'),
    '000376@kopeg-bki.id',
    'Muhibuddin, ST',
    'member',
    '000376',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000378@kopeg-bki.id'),
    '000378@kopeg-bki.id',
    'Muhson Nurrochmat',
    'member',
    '000378',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000379@kopeg-bki.id'),
    '000379@kopeg-bki.id',
    'Mukti Bravita',
    'member',
    '000379',
    'MS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000382@kopeg-bki.id'),
    '000382@kopeg-bki.id',
    'Mushawwir Razak',
    'member',
    '000382',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000383@kopeg-bki.id'),
    '000383@kopeg-bki.id',
    'Muslim',
    'member',
    '000383',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000384@kopeg-bki.id'),
    '000384@kopeg-bki.id',
    'Mustakim ST',
    'member',
    '000384',
    'AB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000385@kopeg-bki.id'),
    '000385@kopeg-bki.id',
    'Mustari. Amk. C/MME',
    'member',
    '000385',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000387@kopeg-bki.id'),
    '000387@kopeg-bki.id',
    'Nano L, Ir',
    'member',
    '000387',
    'SB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000388@kopeg-bki.id'),
    '000388@kopeg-bki.id',
    'Narso, M.Mer.E',
    'member',
    '000388',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000390@kopeg-bki.id'),
    '000390@kopeg-bki.id',
    'Nasaruddin, SE',
    'member',
    '000390',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000392@kopeg-bki.id'),
    '000392@kopeg-bki.id',
    'Nerlan Pasaribu, ST',
    'member',
    '000392',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000393@kopeg-bki.id'),
    '000393@kopeg-bki.id',
    'Nina Sri Indah Yani',
    'member',
    '000393',
    'BJ',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000394@kopeg-bki.id'),
    '000394@kopeg-bki.id',
    'Noor Kholis',
    'member',
    '000394',
    'CGC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000395@kopeg-bki.id'),
    '000395@kopeg-bki.id',
    'Nosy Osriat',
    'member',
    '000395',
    'PKK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000396@kopeg-bki.id'),
    '000396@kopeg-bki.id',
    'Noviansyah Pamungkas',
    'member',
    '000396',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000397@kopeg-bki.id'),
    '000397@kopeg-bki.id',
    'Nur Hasan Sidiq. ST',
    'member',
    '000397',
    'SD',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000398@kopeg-bki.id'),
    '000398@kopeg-bki.id',
    'Nur Rahmad Hidayat, ST',
    'member',
    '000398',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000402@kopeg-bki.id'),
    '000402@kopeg-bki.id',
    'Nurhayati',
    'member',
    '000402',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000404@kopeg-bki.id'),
    '000404@kopeg-bki.id',
    'Nurul Huda',
    'member',
    '000404',
    'SB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000408@kopeg-bki.id'),
    '000408@kopeg-bki.id',
    'Pardi Abbas, Ir',
    'member',
    '000408',
    'SPI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000411@kopeg-bki.id'),
    '000411@kopeg-bki.id',
    'Patunru Pongky, Drs.',
    'member',
    '000411',
    'BP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000412@kopeg-bki.id'),
    '000412@kopeg-bki.id',
    'Pieter Petrus Paulus, Ir',
    'member',
    '000412',
    'TP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000413@kopeg-bki.id'),
    '000413@kopeg-bki.id',
    'Poegoeh Setiono, Ir',
    'member',
    '000413',
    'TP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000414@kopeg-bki.id'),
    '000414@kopeg-bki.id',
    'Prasetyo S.T',
    'member',
    '000414',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000417@kopeg-bki.id'),
    '000417@kopeg-bki.id',
    'Pujatmanto Bastriadi, S.Sos',
    'member',
    '000417',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000419@kopeg-bki.id'),
    '000419@kopeg-bki.id',
    'Purwantia',
    'member',
    '000419',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000420@kopeg-bki.id'),
    '000420@kopeg-bki.id',
    'Putri Nurlaksmi. SE',
    'member',
    '000420',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000421@kopeg-bki.id'),
    '000421@kopeg-bki.id',
    'R. Agus Doddy Dwisagita.',
    'member',
    '000421',
    'DOC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000422@kopeg-bki.id'),
    '000422@kopeg-bki.id',
    'R. Sapto Agung. P',
    'member',
    '000422',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000423@kopeg-bki.id'),
    '000423@kopeg-bki.id',
    'R.M. Kurnaefi',
    'member',
    '000423',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000426@kopeg-bki.id'),
    '000426@kopeg-bki.id',
    'Rachmat Kurniawan',
    'member',
    '000426',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000428@kopeg-bki.id'),
    '000428@kopeg-bki.id',
    'Radjin Sitorus',
    'member',
    '000428',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000430@kopeg-bki.id'),
    '000430@kopeg-bki.id',
    'Rahadi Sigit',
    'member',
    '000430',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000431@kopeg-bki.id'),
    '000431@kopeg-bki.id',
    'Rahmadani',
    'member',
    '000431',
    'PRC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000432@kopeg-bki.id'),
    '000432@kopeg-bki.id',
    'Rahman Susilo',
    'member',
    '000432',
    'SPI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000434@kopeg-bki.id'),
    '000434@kopeg-bki.id',
    'Ratna Dewi',
    'member',
    '000434',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000437@kopeg-bki.id'),
    '000437@kopeg-bki.id',
    'Reni P Simatupang',
    'member',
    '000437',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000439@kopeg-bki.id'),
    '000439@kopeg-bki.id',
    'Ridhayani',
    'member',
    '000439',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000440@kopeg-bki.id'),
    '000440@kopeg-bki.id',
    'Ridwan Arifin, ST',
    'member',
    '000440',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000442@kopeg-bki.id'),
    '000442@kopeg-bki.id',
    'Rima Novedia  Bangun, Ir',
    'member',
    '000442',
    'MRKU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000443@kopeg-bki.id'),
    '000443@kopeg-bki.id',
    'Rino Yan Cahyo, SE',
    'member',
    '000443',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000446@kopeg-bki.id'),
    '000446@kopeg-bki.id',
    'Riyanto',
    'member',
    '000446',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000447@kopeg-bki.id'),
    '000447@kopeg-bki.id',
    'Rizal Febrianto',
    'member',
    '000447',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000448@kopeg-bki.id'),
    '000448@kopeg-bki.id',
    'Rochmansyah',
    'member',
    '000448',
    'DOC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000449@kopeg-bki.id'),
    '000449@kopeg-bki.id',
    'Romillo Libra Setiadi',
    'member',
    '000449',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000451@kopeg-bki.id'),
    '000451@kopeg-bki.id',
    'Roni Karuniawan',
    'member',
    '000451',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000453@kopeg-bki.id'),
    '000453@kopeg-bki.id',
    'Rosalina Amran, SE',
    'member',
    '000453',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000459@kopeg-bki.id'),
    '000459@kopeg-bki.id',
    'Rudi Haryanto',
    'member',
    '000459',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000460@kopeg-bki.id'),
    '000460@kopeg-bki.id',
    'Rudy Sunaryadi , Ir',
    'member',
    '000460',
    'BNC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000463@kopeg-bki.id'),
    '000463@kopeg-bki.id',
    'Rusdin Haluddin  Ir',
    'member',
    '000463',
    'BMC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000464@kopeg-bki.id'),
    '000464@kopeg-bki.id',
    'Sabaruddin',
    'member',
    '000464',
    'PB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000465@kopeg-bki.id'),
    '000465@kopeg-bki.id',
    'Sabrina Mutiara Fani',
    'member',
    '000465',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000466@kopeg-bki.id'),
    '000466@kopeg-bki.id',
    'Sjaifuddin, M.SC',
    'member',
    '000466',
    'DOK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000467@kopeg-bki.id'),
    '000467@kopeg-bki.id',
    'Safiuddin, ST',
    'member',
    '000467',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000468@kopeg-bki.id'),
    '000468@kopeg-bki.id',
    'Safril',
    'member',
    '000468',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000469@kopeg-bki.id'),
    '000469@kopeg-bki.id',
    'Saifoedin, ir',
    'member',
    '000469',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000470@kopeg-bki.id'),
    '000470@kopeg-bki.id',
    'Saifuddin Wijaya, Ir',
    'member',
    '000470',
    'DIREKSI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000471@kopeg-bki.id'),
    '000471@kopeg-bki.id',
    'Salvinus Patangke, Ir',
    'member',
    '000471',
    'M&K',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000472@kopeg-bki.id'),
    '000472@kopeg-bki.id',
    'Samsul Arif. ST',
    'member',
    '000472',
    'BJ',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000474@kopeg-bki.id'),
    '000474@kopeg-bki.id',
    'Saptono',
    'member',
    '000474',
    'MAC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000476@kopeg-bki.id'),
    '000476@kopeg-bki.id',
    'Sari Putri Pertiwi',
    'member',
    '000476',
    'PHP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000477@kopeg-bki.id'),
    '000477@kopeg-bki.id',
    'Saridi',
    'member',
    '000477',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000479@kopeg-bki.id'),
    '000479@kopeg-bki.id',
    'Sefia Helmina, ST',
    'member',
    '000479',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000481@kopeg-bki.id'),
    '000481@kopeg-bki.id',
    'Shindu Purwanto, Ir',
    'member',
    '000481',
    'JB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000482@kopeg-bki.id'),
    '000482@kopeg-bki.id',
    'Sigit Prastowo, Ir',
    'member',
    '000482',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000485@kopeg-bki.id'),
    '000485@kopeg-bki.id',
    'Siswanto ,ST',
    'member',
    '000485',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000487@kopeg-bki.id'),
    '000487@kopeg-bki.id',
    'Siti Komariah. ir',
    'member',
    '000487',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000494@kopeg-bki.id'),
    '000494@kopeg-bki.id',
    'Sofyan Hadi. ST',
    'member',
    '000494',
    'DOK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000495@kopeg-bki.id'),
    '000495@kopeg-bki.id',
    'Soleh Abidin',
    'member',
    '000495',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000498@kopeg-bki.id'),
    '000498@kopeg-bki.id',
    'Sri Atik, Dra',
    'member',
    '000498',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000499@kopeg-bki.id'),
    '000499@kopeg-bki.id',
    'Sri Dewi Amalia, Ir',
    'member',
    '000499',
    'PHP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000500@kopeg-bki.id'),
    '000500@kopeg-bki.id',
    'Sri Jatmiko, Ir',
    'member',
    '000500',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000501@kopeg-bki.id'),
    '000501@kopeg-bki.id',
    'Sri Mulyanti',
    'member',
    '000501',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000502@kopeg-bki.id'),
    '000502@kopeg-bki.id',
    'Sri Rachmi Andayani, Ir',
    'member',
    '000502',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000505@kopeg-bki.id'),
    '000505@kopeg-bki.id',
    'Sriyati',
    'member',
    '000505',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000506@kopeg-bki.id'),
    '000506@kopeg-bki.id',
    'Su''ad Syuhada, SE, MM',
    'member',
    '000506',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000507@kopeg-bki.id'),
    '000507@kopeg-bki.id',
    'Subur',
    'member',
    '000507',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000510@kopeg-bki.id'),
    '000510@kopeg-bki.id',
    'Sudirman, SE',
    'member',
    '000510',
    'MS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000511@kopeg-bki.id'),
    '000511@kopeg-bki.id',
    'Sudiro, A.md.',
    'member',
    '000511',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000512@kopeg-bki.id'),
    '000512@kopeg-bki.id',
    'Sugeng Yulianto, Ir',
    'member',
    '000512',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000513@kopeg-bki.id'),
    '000513@kopeg-bki.id',
    'Suhar Chandra Kurniawan, ST',
    'member',
    '000513',
    'SD',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000514@kopeg-bki.id'),
    '000514@kopeg-bki.id',
    'Suherman Sardi',
    'member',
    '000514',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000515@kopeg-bki.id'),
    '000515@kopeg-bki.id',
    'Suhita Wardani, SE',
    'member',
    '000515',
    'SBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000517@kopeg-bki.id'),
    '000517@kopeg-bki.id',
    'Sukadi Redji',
    'member',
    '000517',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000518@kopeg-bki.id'),
    '000518@kopeg-bki.id',
    'Sukiyo, Drs',
    'member',
    '000518',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000519@kopeg-bki.id'),
    '000519@kopeg-bki.id',
    'Sukma Maharani, ST',
    'member',
    '000519',
    'PHP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000520@kopeg-bki.id'),
    '000520@kopeg-bki.id',
    'Sukria',
    'member',
    '000520',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000521@kopeg-bki.id'),
    '000521@kopeg-bki.id',
    'Sukron Makmun ST',
    'member',
    '000521',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000522@kopeg-bki.id'),
    '000522@kopeg-bki.id',
    'Sulaeman',
    'member',
    '000522',
    'KOP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000524@kopeg-bki.id'),
    '000524@kopeg-bki.id',
    'Sulasman Ardi, Ir.',
    'member',
    '000524',
    'MKS',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000526@kopeg-bki.id'),
    '000526@kopeg-bki.id',
    'Sulthan Said, M.Sc.',
    'member',
    '000526',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000527@kopeg-bki.id'),
    '000527@kopeg-bki.id',
    'Sumartini',
    'member',
    '000527',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000531@kopeg-bki.id'),
    '000531@kopeg-bki.id',
    'Suprapti',
    'member',
    '000531',
    'BP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000534@kopeg-bki.id'),
    '000534@kopeg-bki.id',
    'Suriaty Paramita Putri, ST',
    'member',
    '000534',
    'MRKU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000535@kopeg-bki.id'),
    '000535@kopeg-bki.id',
    'Suroso Tumidiono',
    'member',
    '000535',
    'PK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000538@kopeg-bki.id'),
    '000538@kopeg-bki.id',
    'Suryanto',
    'member',
    '000538',
    'BPC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000539@kopeg-bki.id'),
    '000539@kopeg-bki.id',
    'Susetyo Wijanarko',
    'member',
    '000539',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000541@kopeg-bki.id'),
    '000541@kopeg-bki.id',
    'Sutrisno',
    'member',
    '000541',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000543@kopeg-bki.id'),
    '000543@kopeg-bki.id',
    'Suyani',
    'member',
    '000543',
    'BJ',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000545@kopeg-bki.id'),
    '000545@kopeg-bki.id',
    'Syahlir',
    'member',
    '000545',
    'PKK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000548@kopeg-bki.id'),
    '000548@kopeg-bki.id',
    'Syarif Hidayat',
    'member',
    '000548',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000549@kopeg-bki.id'),
    '000549@kopeg-bki.id',
    'Syarif, Ir',
    'member',
    '000549',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000550@kopeg-bki.id'),
    '000550@kopeg-bki.id',
    'Tantyo Prayogo, Ir',
    'member',
    '000550',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000552@kopeg-bki.id'),
    '000552@kopeg-bki.id',
    'Taufik Hidayat, SE, MM.',
    'member',
    '000552',
    'MS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000554@kopeg-bki.id'),
    '000554@kopeg-bki.id',
    'Teguh Andani S.Sos',
    'member',
    '000554',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000555@kopeg-bki.id'),
    '000555@kopeg-bki.id',
    'Teguh Budi Santoso. Ir',
    'member',
    '000555',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000558@kopeg-bki.id'),
    '000558@kopeg-bki.id',
    'Togap Hidayat. Ir',
    'member',
    '000558',
    'DOC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000560@kopeg-bki.id'),
    '000560@kopeg-bki.id',
    'Toni Syarif Hidayat',
    'member',
    '000560',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000562@kopeg-bki.id'),
    '000562@kopeg-bki.id',
    'Totok Achmad, Ir',
    'member',
    '000562',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000563@kopeg-bki.id'),
    '000563@kopeg-bki.id',
    'Tri Buana Galaxi',
    'member',
    '000563',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000564@kopeg-bki.id'),
    '000564@kopeg-bki.id',
    'Tri Januar Pratama',
    'member',
    '000564',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000565@kopeg-bki.id'),
    '000565@kopeg-bki.id',
    'Tri Laksono, Ir',
    'member',
    '000565',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000567@kopeg-bki.id'),
    '000567@kopeg-bki.id',
    'Triyono Samuel, ST.',
    'member',
    '000567',
    'PBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000570@kopeg-bki.id'),
    '000570@kopeg-bki.id',
    'Untung Prasetyo',
    'member',
    '000570',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000571@kopeg-bki.id'),
    '000571@kopeg-bki.id',
    'Vecky Budiman CI',
    'member',
    '000571',
    'SBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000573@kopeg-bki.id'),
    '000573@kopeg-bki.id',
    'Wahidin',
    'member',
    '000573',
    'M&K',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000574@kopeg-bki.id'),
    '000574@kopeg-bki.id',
    'Wahjoe Ario Tedjo, Ir',
    'member',
    '000574',
    'PKC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000575@kopeg-bki.id'),
    '000575@kopeg-bki.id',
    'Wahyu Priambodo, ST.',
    'member',
    '000575',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000579@kopeg-bki.id'),
    '000579@kopeg-bki.id',
    'Wasito Abdul Mukit, Ir',
    'member',
    '000579',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000581@kopeg-bki.id'),
    '000581@kopeg-bki.id',
    'Wawan Priya Widyanta',
    'member',
    '000581',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000584@kopeg-bki.id'),
    '000584@kopeg-bki.id',
    'Wibisono R.  Ir',
    'member',
    '000584',
    'DP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000585@kopeg-bki.id'),
    '000585@kopeg-bki.id',
    'Widodo',
    'member',
    '000585',
    'PBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000586@kopeg-bki.id'),
    '000586@kopeg-bki.id',
    'Winarto',
    'member',
    '000586',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000587@kopeg-bki.id'),
    '000587@kopeg-bki.id',
    'Wiyono, Ir',
    'member',
    '000587',
    'TP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000589@kopeg-bki.id'),
    '000589@kopeg-bki.id',
    'Yansen Miri, Ir',
    'member',
    '000589',
    'PHP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000593@kopeg-bki.id'),
    '000593@kopeg-bki.id',
    'Yohana Kaonseng',
    'member',
    '000593',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000594@kopeg-bki.id'),
    '000594@kopeg-bki.id',
    'Yudas Pasomba',
    'member',
    '000594',
    'PPO',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000595@kopeg-bki.id'),
    '000595@kopeg-bki.id',
    'Yudhi Ardikusuma AMK-C.',
    'member',
    '000595',
    'SB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000596@kopeg-bki.id'),
    '000596@kopeg-bki.id',
    'Yudi Wasianto, Ir',
    'member',
    '000596',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000597@kopeg-bki.id'),
    '000597@kopeg-bki.id',
    'Yulia Dian Anggraini',
    'member',
    '000597',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000598@kopeg-bki.id'),
    '000598@kopeg-bki.id',
    'Yulian Apriyanto. Ir',
    'member',
    '000598',
    'JB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000599@kopeg-bki.id'),
    '000599@kopeg-bki.id',
    'Yulid Anji. ST',
    'member',
    '000599',
    'BM',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000603@kopeg-bki.id'),
    '000603@kopeg-bki.id',
    'Yusfi Noer Aryani',
    'member',
    '000603',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000604@kopeg-bki.id'),
    '000604@kopeg-bki.id',
    'Yusman Susa',
    'member',
    '000604',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000624@kopeg-bki.id'),
    '000624@kopeg-bki.id',
    'Marwanto',
    'member',
    '000624',
    'MAC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000630@kopeg-bki.id'),
    '000630@kopeg-bki.id',
    'Andi Gunawan Sunre',
    'member',
    '000630',
    'MKS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000632@kopeg-bki.id'),
    '000632@kopeg-bki.id',
    'Umar Agus Irianto',
    'member',
    '000632',
    'SM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000636@kopeg-bki.id'),
    '000636@kopeg-bki.id',
    'Awaludin Painging, ST.',
    'member',
    '000636',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000638@kopeg-bki.id'),
    '000638@kopeg-bki.id',
    'Fitriani A. Md.',
    'member',
    '000638',
    'PK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000639@kopeg-bki.id'),
    '000639@kopeg-bki.id',
    'M. Rizky Purnama',
    'member',
    '000639',
    'BPC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000641@kopeg-bki.id'),
    '000641@kopeg-bki.id',
    'Renza Muharam',
    'member',
    '000641',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000643@kopeg-bki.id'),
    '000643@kopeg-bki.id',
    'Warini',
    'member',
    '000643',
    'MRKU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000646@kopeg-bki.id'),
    '000646@kopeg-bki.id',
    'Adhi kholidin',
    'member',
    '000646',
    'MS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000647@kopeg-bki.id'),
    '000647@kopeg-bki.id',
    'Adi Yudho Wijayanto, ST',
    'member',
    '000647',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000648@kopeg-bki.id'),
    '000648@kopeg-bki.id',
    'Agris Setyawan, ST.',
    'member',
    '000648',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000650@kopeg-bki.id'),
    '000650@kopeg-bki.id',
    'Andre Guntur Teguh WS, ST.',
    'member',
    '000650',
    'PB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000651@kopeg-bki.id'),
    '000651@kopeg-bki.id',
    'Angga Santoso',
    'member',
    '000651',
    NULL,
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000652@kopeg-bki.id'),
    '000652@kopeg-bki.id',
    'Angga Yustiawan, ST.',
    'member',
    '000652',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000655@kopeg-bki.id'),
    '000655@kopeg-bki.id',
    'Bambang Tri Nugroho',
    'member',
    '000655',
    'BJC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000656@kopeg-bki.id'),
    '000656@kopeg-bki.id',
    'Bayu Mahardika W, ST.',
    'member',
    '000656',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000658@kopeg-bki.id'),
    '000658@kopeg-bki.id',
    'Bobby A. Novrianto',
    'member',
    '000658',
    'ACD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000660@kopeg-bki.id'),
    '000660@kopeg-bki.id',
    'Budi Fitriawan, ST.',
    'member',
    '000660',
    'PKK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000661@kopeg-bki.id'),
    '000661@kopeg-bki.id',
    'Budiwansyah',
    'member',
    '000661',
    'PBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000662@kopeg-bki.id'),
    '000662@kopeg-bki.id',
    'Busrol',
    'member',
    '000662',
    'ISPB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000663@kopeg-bki.id'),
    '000663@kopeg-bki.id',
    'Donny Putra Santika',
    'member',
    '000663',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000664@kopeg-bki.id'),
    '000664@kopeg-bki.id',
    'Eko Maja Priyanto, ST.',
    'member',
    '000664',
    'SBU MNO',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000665@kopeg-bki.id'),
    '000665@kopeg-bki.id',
    'Fachruddin, ST.',
    'member',
    '000665',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000666@kopeg-bki.id'),
    '000666@kopeg-bki.id',
    'Fachruddin Nur, ST.',
    'member',
    '000666',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000667@kopeg-bki.id'),
    '000667@kopeg-bki.id',
    'Firmansyah Putra AM, ST.',
    'member',
    '000667',
    'BJ',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000669@kopeg-bki.id'),
    '000669@kopeg-bki.id',
    'Hendra, ST,',
    'member',
    '000669',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000671@kopeg-bki.id'),
    '000671@kopeg-bki.id',
    'Hendra Saputra',
    'member',
    '000671',
    NULL,
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000672@kopeg-bki.id'),
    '000672@kopeg-bki.id',
    'I Gusti Ngurah Wira P, ST.',
    'member',
    '000672',
    'PR',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000676@kopeg-bki.id'),
    '000676@kopeg-bki.id',
    'Indra Mariska Amd.',
    'member',
    '000676',
    'PBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000679@kopeg-bki.id'),
    '000679@kopeg-bki.id',
    'Kartika Kushendra, Dr.',
    'member',
    '000679',
    'MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000680@kopeg-bki.id'),
    '000680@kopeg-bki.id',
    'Khairul Akbar ST.',
    'member',
    '000680',
    'PBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000681@kopeg-bki.id'),
    '000681@kopeg-bki.id',
    'LA Ode Abdul Rahman F, ST.',
    'member',
    '000681',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000683@kopeg-bki.id'),
    '000683@kopeg-bki.id',
    'M. Yudi Oktavianto, ST.',
    'member',
    '000683',
    'RP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000684@kopeg-bki.id'),
    '000684@kopeg-bki.id',
    'Mahesa Saga, ST.',
    'member',
    '000684',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000685@kopeg-bki.id'),
    '000685@kopeg-bki.id',
    'Muh. Asqar, ST.',
    'member',
    '000685',
    'MKS',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000686@kopeg-bki.id'),
    '000686@kopeg-bki.id',
    'Muhammad Irfan, ST.',
    'member',
    '000686',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000689@kopeg-bki.id'),
    '000689@kopeg-bki.id',
    'Neni Yuniarti',
    'member',
    '000689',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000690@kopeg-bki.id'),
    '000690@kopeg-bki.id',
    'Nevi Eko Yuliananto, ST.',
    'member',
    '000690',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000691@kopeg-bki.id'),
    '000691@kopeg-bki.id',
    'Noah Cahyasasnita, ST.',
    'member',
    '000691',
    'SR',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000692@kopeg-bki.id'),
    '000692@kopeg-bki.id',
    'Ridwan Ahmad Fauzi, ST.',
    'member',
    '000692',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000693@kopeg-bki.id'),
    '000693@kopeg-bki.id',
    'Riska Deriani M, ST.',
    'member',
    '000693',
    'RP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000694@kopeg-bki.id'),
    '000694@kopeg-bki.id',
    'Riswan Akbar, ST.',
    'member',
    '000694',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000695@kopeg-bki.id'),
    '000695@kopeg-bki.id',
    'Ruri Apridah',
    'member',
    '000695',
    'BNC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000696@kopeg-bki.id'),
    '000696@kopeg-bki.id',
    'Sigit Suhakso',
    'member',
    '000696',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000699@kopeg-bki.id'),
    '000699@kopeg-bki.id',
    'Suwandy, ST.',
    'member',
    '000699',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000700@kopeg-bki.id'),
    '000700@kopeg-bki.id',
    'Syari Dodi A.Yani',
    'member',
    '000700',
    'BNC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000701@kopeg-bki.id'),
    '000701@kopeg-bki.id',
    'Syariful Mahsyar, ST.',
    'member',
    '000701',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000702@kopeg-bki.id'),
    '000702@kopeg-bki.id',
    'Trian Indrawan, ST.',
    'member',
    '000702',
    'DOC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000703@kopeg-bki.id'),
    '000703@kopeg-bki.id',
    'Wanginingastuti M, ST.',
    'member',
    '000703',
    'RP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000705@kopeg-bki.id'),
    '000705@kopeg-bki.id',
    'Zainal ST.',
    'member',
    '000705',
    'PBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000706@kopeg-bki.id'),
    '000706@kopeg-bki.id',
    'Jakaria',
    'member',
    '000706',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000707@kopeg-bki.id'),
    '000707@kopeg-bki.id',
    'Hendro Lukito',
    'member',
    '000707',
    'PBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000711@kopeg-bki.id'),
    '000711@kopeg-bki.id',
    'Lucky Lukman Nur Hakim',
    'member',
    '000711',
    'BALIKPAPAN',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000712@kopeg-bki.id'),
    '000712@kopeg-bki.id',
    'Hendry Kurniawan',
    'member',
    '000712',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000714@kopeg-bki.id'),
    '000714@kopeg-bki.id',
    'Capt. Iman Satria Utama',
    'member',
    '000714',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000716@kopeg-bki.id'),
    '000716@kopeg-bki.id',
    'Muhammad Rizky Satrio',
    'member',
    '000716',
    'HCS',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000727@kopeg-bki.id'),
    '000727@kopeg-bki.id',
    'Abdur Rahman, S.T',
    'member',
    '000727',
    'SPI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000728@kopeg-bki.id'),
    '000728@kopeg-bki.id',
    'Sari Gita Tantini',
    'member',
    '000728',
    'SPI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000729@kopeg-bki.id'),
    '000729@kopeg-bki.id',
    'Dwi Cahyo Kurniawan',
    'member',
    '000729',
    'MRKU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000730@kopeg-bki.id'),
    '000730@kopeg-bki.id',
    'Bayu Indra Purbaya',
    'member',
    '000730',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000731@kopeg-bki.id'),
    '000731@kopeg-bki.id',
    'Riki Sanjaya',
    'member',
    '000731',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000743@kopeg-bki.id'),
    '000743@kopeg-bki.id',
    'Agus Sunarto',
    'member',
    '000743',
    'DOC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000746@kopeg-bki.id'),
    '000746@kopeg-bki.id',
    'Slamet Apriadi',
    'member',
    '000746',
    'MAC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000748@kopeg-bki.id'),
    '000748@kopeg-bki.id',
    'Afif Amrullah, ST',
    'member',
    '000748',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000749@kopeg-bki.id'),
    '000749@kopeg-bki.id',
    'Andik Eko Saputro, ST',
    'member',
    '000749',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000750@kopeg-bki.id'),
    '000750@kopeg-bki.id',
    'Nomo Prihasta, ST',
    'member',
    '000750',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000751@kopeg-bki.id'),
    '000751@kopeg-bki.id',
    'Wawan Widiatmoko, ST',
    'member',
    '000751',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000752@kopeg-bki.id'),
    '000752@kopeg-bki.id',
    'Taufik Akbar, ST',
    'member',
    '000752',
    'M&K',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000753@kopeg-bki.id'),
    '000753@kopeg-bki.id',
    'Abdul Kholick, ST',
    'member',
    '000753',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000754@kopeg-bki.id'),
    '000754@kopeg-bki.id',
    'Agus Ericson Sianipar, ST',
    'member',
    '000754',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000755@kopeg-bki.id'),
    '000755@kopeg-bki.id',
    'Alfan Fadhli, ST',
    'member',
    '000755',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000757@kopeg-bki.id'),
    '000757@kopeg-bki.id',
    'Amir Hamzah, ST',
    'member',
    '000757',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000759@kopeg-bki.id'),
    '000759@kopeg-bki.id',
    'Arifin Gustian Pramoko, ST',
    'member',
    '000759',
    'BM',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000760@kopeg-bki.id'),
    '000760@kopeg-bki.id',
    'Eka Nanda Pratama S, ST',
    'member',
    '000760',
    'BJ',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000761@kopeg-bki.id'),
    '000761@kopeg-bki.id',
    'Ferry Fadli, ST',
    'member',
    '000761',
    'BJ',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000763@kopeg-bki.id'),
    '000763@kopeg-bki.id',
    'Gary Simon',
    'member',
    '000763',
    'DOK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000764@kopeg-bki.id'),
    '000764@kopeg-bki.id',
    'I Nyoman Eriksandika P, ST',
    'member',
    '000764',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000765@kopeg-bki.id'),
    '000765@kopeg-bki.id',
    'La Ode Abdul Haslan P, ST',
    'member',
    '000765',
    'PB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000766@kopeg-bki.id'),
    '000766@kopeg-bki.id',
    'Sandi Nandarianto, ST',
    'member',
    '000766',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000767@kopeg-bki.id'),
    '000767@kopeg-bki.id',
    'Sang Lanang S, ST',
    'member',
    '000767',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000768@kopeg-bki.id'),
    '000768@kopeg-bki.id',
    'Sigit Pamungkas, ST',
    'member',
    '000768',
    'BJ',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000769@kopeg-bki.id'),
    '000769@kopeg-bki.id',
    'Yogia Rivaldhi, ST',
    'member',
    '000769',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000770@kopeg-bki.id'),
    '000770@kopeg-bki.id',
    'Bambang Firdiansyah H. K, ST',
    'member',
    '000770',
    'BP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000773@kopeg-bki.id'),
    '000773@kopeg-bki.id',
    'Septi Wulandari,',
    'member',
    '000773',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000774@kopeg-bki.id'),
    '000774@kopeg-bki.id',
    'Irawati, ST',
    'member',
    '000774',
    'STA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000775@kopeg-bki.id'),
    '000775@kopeg-bki.id',
    'Gde Sandhyana P, S.KOM',
    'member',
    '000775',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000776@kopeg-bki.id'),
    '000776@kopeg-bki.id',
    'Ndaru Triwibowo',
    'member',
    '000776',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000780@kopeg-bki.id'),
    '000780@kopeg-bki.id',
    'Hardian, S.KOM.',
    'member',
    '000780',
    'TI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000781@kopeg-bki.id'),
    '000781@kopeg-bki.id',
    'Muhamad Sofian Ibrahim',
    'member',
    '000781',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000788@kopeg-bki.id'),
    '000788@kopeg-bki.id',
    'Aziz Husain',
    'member',
    '000788',
    'BMC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000789@kopeg-bki.id'),
    '000789@kopeg-bki.id',
    'Aziza',
    'member',
    '000789',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000791@kopeg-bki.id'),
    '000791@kopeg-bki.id',
    'Agiyani Permana Putra',
    'member',
    '000791',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000792@kopeg-bki.id'),
    '000792@kopeg-bki.id',
    'Agung Prasetyo',
    'member',
    '000792',
    'PKK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000793@kopeg-bki.id'),
    '000793@kopeg-bki.id',
    'Apriansyah',
    'member',
    '000793',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000794@kopeg-bki.id'),
    '000794@kopeg-bki.id',
    'M. Abdurrahman Ali',
    'member',
    '000794',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000795@kopeg-bki.id'),
    '000795@kopeg-bki.id',
    'Sahdat Farma Ridho',
    'member',
    '000795',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000796@kopeg-bki.id'),
    '000796@kopeg-bki.id',
    'Yulia Fajri Kinanti',
    'member',
    '000796',
    'KU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000797@kopeg-bki.id'),
    '000797@kopeg-bki.id',
    'Itqan Harchia',
    'member',
    '000797',
    'MRKU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000798@kopeg-bki.id'),
    '000798@kopeg-bki.id',
    'Holis Nor Aini',
    'member',
    '000798',
    'MRKU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000799@kopeg-bki.id'),
    '000799@kopeg-bki.id',
    'Muchlis Rachman, S.Kom.',
    'member',
    '000799',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000801@kopeg-bki.id'),
    '000801@kopeg-bki.id',
    'Ahmad Barnes',
    'member',
    '000801',
    'MRKU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000805@kopeg-bki.id'),
    '000805@kopeg-bki.id',
    'M. Rahmat Akbar Ramadhan, S.KOM.',
    'member',
    '000805',
    'TI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000807@kopeg-bki.id'),
    '000807@kopeg-bki.id',
    'Tri Budiyanto',
    'member',
    '000807',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000809@kopeg-bki.id'),
    '000809@kopeg-bki.id',
    'Atika Nurhikmah',
    'member',
    '000809',
    'BMC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000815@kopeg-bki.id'),
    '000815@kopeg-bki.id',
    'Muslim Dermawan B',
    'member',
    '000815',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000818@kopeg-bki.id'),
    '000818@kopeg-bki.id',
    'Edit Hasta Prihantika',
    'member',
    '000818',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000819@kopeg-bki.id'),
    '000819@kopeg-bki.id',
    'Satria Aldi Permana',
    'member',
    '000819',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000820@kopeg-bki.id'),
    '000820@kopeg-bki.id',
    'Azhar Ghifari',
    'member',
    '000820',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000822@kopeg-bki.id'),
    '000822@kopeg-bki.id',
    'Andi Dina',
    'member',
    '000822',
    'BMC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000824@kopeg-bki.id'),
    '000824@kopeg-bki.id',
    'Rudiyanto, Ir',
    'member',
    '000824',
    'DIREKSI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000829@kopeg-bki.id'),
    '000829@kopeg-bki.id',
    'Sahat',
    'member',
    '000829',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000830@kopeg-bki.id'),
    '000830@kopeg-bki.id',
    'Feriza Yusfi',
    'member',
    '000830',
    'PR',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000831@kopeg-bki.id'),
    '000831@kopeg-bki.id',
    'Dian Febrian, S.T',
    'member',
    '000831',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000832@kopeg-bki.id'),
    '000832@kopeg-bki.id',
    'Andi Dian Eka Anggriani, S.T',
    'member',
    '000832',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000833@kopeg-bki.id'),
    '000833@kopeg-bki.id',
    'Rizki Aldila Tamtura, S.T',
    'member',
    '000833',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000834@kopeg-bki.id'),
    '000834@kopeg-bki.id',
    'Deborah Nindya Pawestri, SH',
    'member',
    '000834',
    'LC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000835@kopeg-bki.id'),
    '000835@kopeg-bki.id',
    'Willy Adi Nugroho, SH',
    'member',
    '000835',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000837@kopeg-bki.id'),
    '000837@kopeg-bki.id',
    'Faulincia, S.T',
    'member',
    '000837',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000839@kopeg-bki.id'),
    '000839@kopeg-bki.id',
    'Lutfi Palam Paraya, S.T',
    'member',
    '000839',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000842@kopeg-bki.id'),
    '000842@kopeg-bki.id',
    'Muhamad Baqi, S.T',
    'member',
    '000842',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000843@kopeg-bki.id'),
    '000843@kopeg-bki.id',
    'Rangsang Kusumadilaga, S.T',
    'member',
    '000843',
    'SD',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000844@kopeg-bki.id'),
    '000844@kopeg-bki.id',
    'Septian Aji Dewangkara',
    'member',
    '000844',
    'PK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000845@kopeg-bki.id'),
    '000845@kopeg-bki.id',
    'Setiono Prabowo, S.T',
    'member',
    '000845',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000846@kopeg-bki.id'),
    '000846@kopeg-bki.id',
    'Tesi Hidayati',
    'member',
    '000846',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000849@kopeg-bki.id'),
    '000849@kopeg-bki.id',
    'Timbul Tambunan',
    'member',
    '000849',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000851@kopeg-bki.id'),
    '000851@kopeg-bki.id',
    'Andri Rezeki',
    'member',
    '000851',
    'SEKPER',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000855@kopeg-bki.id'),
    '000855@kopeg-bki.id',
    'Edi Zulkarnain',
    'member',
    '000855',
    'JB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000856@kopeg-bki.id'),
    '000856@kopeg-bki.id',
    'Brams Firnandes',
    'member',
    '000856',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000857@kopeg-bki.id'),
    '000857@kopeg-bki.id',
    'Fauzi S, ST',
    'member',
    '000857',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000858@kopeg-bki.id'),
    '000858@kopeg-bki.id',
    'Stefani Nur Fitri',
    'member',
    '000858',
    'KU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000859@kopeg-bki.id'),
    '000859@kopeg-bki.id',
    'Samsul Muslim',
    'member',
    '000859',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000861@kopeg-bki.id'),
    '000861@kopeg-bki.id',
    'M. Adityo Nugroho',
    'member',
    '000861',
    'MRKU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000862@kopeg-bki.id'),
    '000862@kopeg-bki.id',
    'Dedie Achmad Wahyono',
    'member',
    '000862',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000863@kopeg-bki.id'),
    '000863@kopeg-bki.id',
    'Bonor Samuel Charles',
    'member',
    '000863',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000864@kopeg-bki.id'),
    '000864@kopeg-bki.id',
    'M. Setiawan',
    'member',
    '000864',
    'MRKU',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000868@kopeg-bki.id'),
    '000868@kopeg-bki.id',
    'Saepul',
    'member',
    '000868',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000869@kopeg-bki.id'),
    '000869@kopeg-bki.id',
    'Annissa Fadhillah',
    'member',
    '000869',
    'KOP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000870@kopeg-bki.id'),
    '000870@kopeg-bki.id',
    'Rudi Arfiansyah',
    'member',
    '000870',
    'BN',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000871@kopeg-bki.id'),
    '000871@kopeg-bki.id',
    'Yudi Prawoto',
    'member',
    '000871',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000872@kopeg-bki.id'),
    '000872@kopeg-bki.id',
    'Efry Tallamma',
    'member',
    '000872',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000873@kopeg-bki.id'),
    '000873@kopeg-bki.id',
    'Sudarma Edy Saragih',
    'member',
    '000873',
    'BNC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000874@kopeg-bki.id'),
    '000874@kopeg-bki.id',
    'Alwin Ridwan',
    'member',
    '000874',
    'TJSL',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000876@kopeg-bki.id'),
    '000876@kopeg-bki.id',
    'Fatkhurrohman',
    'member',
    '000876',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000877@kopeg-bki.id'),
    '000877@kopeg-bki.id',
    'Fikram Sudarmadi',
    'member',
    '000877',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000878@kopeg-bki.id'),
    '000878@kopeg-bki.id',
    'Ishak Christian Megawe',
    'member',
    '000878',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000880@kopeg-bki.id'),
    '000880@kopeg-bki.id',
    'Joko Susilo',
    'member',
    '000880',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000881@kopeg-bki.id'),
    '000881@kopeg-bki.id',
    'Michelle Chantal Mustamu',
    'member',
    '000881',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000882@kopeg-bki.id'),
    '000882@kopeg-bki.id',
    'Randi Rante',
    'member',
    '000882',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000883@kopeg-bki.id'),
    '000883@kopeg-bki.id',
    'Soepriyanto',
    'member',
    '000883',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000884@kopeg-bki.id'),
    '000884@kopeg-bki.id',
    'Noval Der Sartapayu',
    'member',
    '000884',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000887@kopeg-bki.id'),
    '000887@kopeg-bki.id',
    'Ibnu Nafis',
    'member',
    '000887',
    'BJ',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000888@kopeg-bki.id'),
    '000888@kopeg-bki.id',
    'Airin Christine',
    'member',
    '000888',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000889@kopeg-bki.id'),
    '000889@kopeg-bki.id',
    'Agus Setyowinarno',
    'member',
    '000889',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000891@kopeg-bki.id'),
    '000891@kopeg-bki.id',
    'Berthy Charles',
    'member',
    '000891',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000894@kopeg-bki.id'),
    '000894@kopeg-bki.id',
    'Hery Alwis',
    'member',
    '000894',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000895@kopeg-bki.id'),
    '000895@kopeg-bki.id',
    'Ishak Sudradjat',
    'member',
    '000895',
    'SBU MNO',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000896@kopeg-bki.id'),
    '000896@kopeg-bki.id',
    'Ismail',
    'member',
    '000896',
    'SMC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000897@kopeg-bki.id'),
    '000897@kopeg-bki.id',
    'Jhon Nicodemus P',
    'member',
    '000897',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000898@kopeg-bki.id'),
    '000898@kopeg-bki.id',
    'Muchtar Kartoulomo',
    'member',
    '000898',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000899@kopeg-bki.id'),
    '000899@kopeg-bki.id',
    'Nindia Laurina',
    'member',
    '000899',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000900@kopeg-bki.id'),
    '000900@kopeg-bki.id',
    'Bayu Kadir',
    'member',
    '000900',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000903@kopeg-bki.id'),
    '000903@kopeg-bki.id',
    'Bina Aji Nugraha',
    'member',
    '000903',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000904@kopeg-bki.id'),
    '000904@kopeg-bki.id',
    'Muhammad Idam Yon Arif',
    'member',
    '000904',
    'JB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000905@kopeg-bki.id'),
    '000905@kopeg-bki.id',
    'Ahmad Riadus Sholihivi',
    'member',
    '000905',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000906@kopeg-bki.id'),
    '000906@kopeg-bki.id',
    'Fajar Nugraha, S.T',
    'member',
    '000906',
    'SM',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000907@kopeg-bki.id'),
    '000907@kopeg-bki.id',
    'Mian Saroha Simangunsong',
    'member',
    '000907',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000908@kopeg-bki.id'),
    '000908@kopeg-bki.id',
    'Andrew Cristiant Pramusinta',
    'member',
    '000908',
    'SV',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000909@kopeg-bki.id'),
    '000909@kopeg-bki.id',
    'Yhoga Susila Wardanu',
    'member',
    '000909',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000910@kopeg-bki.id'),
    '000910@kopeg-bki.id',
    'Sutrisno',
    'member',
    '000910',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000911@kopeg-bki.id'),
    '000911@kopeg-bki.id',
    'Purwoko Widhyanto Wirawan',
    'member',
    '000911',
    'PR',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000912@kopeg-bki.id'),
    '000912@kopeg-bki.id',
    'Fahrul Nur Hidayat',
    'member',
    '000912',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000913@kopeg-bki.id'),
    '000913@kopeg-bki.id',
    'Yohanes Ardianto Nugroho',
    'member',
    '000913',
    'AB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000914@kopeg-bki.id'),
    '000914@kopeg-bki.id',
    'Agus Rizqiansyah',
    'member',
    '000914',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000915@kopeg-bki.id'),
    '000915@kopeg-bki.id',
    'Muhammad Aulia',
    'member',
    '000915',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000916@kopeg-bki.id'),
    '000916@kopeg-bki.id',
    'Dwi Aryanto',
    'member',
    '000916',
    'BM',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000920@kopeg-bki.id'),
    '000920@kopeg-bki.id',
    'Tulus Setiyawan W K',
    'member',
    '000920',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000921@kopeg-bki.id'),
    '000921@kopeg-bki.id',
    'Alwi',
    'member',
    '000921',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000922@kopeg-bki.id'),
    '000922@kopeg-bki.id',
    'Risky Hari Prasetyo',
    'member',
    '000922',
    'PK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000923@kopeg-bki.id'),
    '000923@kopeg-bki.id',
    'Fivid Rivantoro',
    'member',
    '000923',
    'PRB',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000924@kopeg-bki.id'),
    '000924@kopeg-bki.id',
    'Eko Haryanto',
    'member',
    '000924',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000925@kopeg-bki.id'),
    '000925@kopeg-bki.id',
    'Adityo Aji Kurniawan',
    'member',
    '000925',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000926@kopeg-bki.id'),
    '000926@kopeg-bki.id',
    'Ryan Hangga Sri Wijiharto',
    'member',
    '000926',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000927@kopeg-bki.id'),
    '000927@kopeg-bki.id',
    'Mokhammad Yufian R',
    'member',
    '000927',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000928@kopeg-bki.id'),
    '000928@kopeg-bki.id',
    'Bramanti Pramawedha S P',
    'member',
    '000928',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000929@kopeg-bki.id'),
    '000929@kopeg-bki.id',
    'Elvino Yusca Putra',
    'member',
    '000929',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000930@kopeg-bki.id'),
    '000930@kopeg-bki.id',
    'Muh Ali Hasan',
    'member',
    '000930',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000931@kopeg-bki.id'),
    '000931@kopeg-bki.id',
    'Ardiansyah Dahlan, S.T.',
    'member',
    '000931',
    'CG',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000933@kopeg-bki.id'),
    '000933@kopeg-bki.id',
    'Mokhammad Fakhrur Rizal',
    'member',
    '000933',
    'SBU MNO',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000934@kopeg-bki.id'),
    '000934@kopeg-bki.id',
    'M Rizqi Fitra H',
    'member',
    '000934',
    'RP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000935@kopeg-bki.id'),
    '000935@kopeg-bki.id',
    'Sony Anggara',
    'member',
    '000935',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000937@kopeg-bki.id'),
    '000937@kopeg-bki.id',
    'M Teguh Widodo',
    'member',
    '000937',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000938@kopeg-bki.id'),
    '000938@kopeg-bki.id',
    'La Ode Muhammad Ichsan, S.T.',
    'member',
    '000938',
    'STA',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000939@kopeg-bki.id'),
    '000939@kopeg-bki.id',
    'Andi Dian Aulya',
    'member',
    '000939',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000940@kopeg-bki.id'),
    '000940@kopeg-bki.id',
    'Haryanti',
    'member',
    '000940',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000944@kopeg-bki.id'),
    '000944@kopeg-bki.id',
    'Febri Denyanto',
    'member',
    '000944',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000945@kopeg-bki.id'),
    '000945@kopeg-bki.id',
    'Rio Fegi',
    'member',
    '000945',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000946@kopeg-bki.id'),
    '000946@kopeg-bki.id',
    'Fatma Kurniasari',
    'member',
    '000946',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000948@kopeg-bki.id'),
    '000948@kopeg-bki.id',
    'Satria Adi Sukma Negara, ST',
    'member',
    '000948',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000949@kopeg-bki.id'),
    '000949@kopeg-bki.id',
    'Irma Yuniati',
    'member',
    '000949',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000950@kopeg-bki.id'),
    '000950@kopeg-bki.id',
    'Bayu Rista, S.T.',
    'member',
    '000950',
    'SB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000951@kopeg-bki.id'),
    '000951@kopeg-bki.id',
    'Daniel Mahardika, S.T.',
    'member',
    '000951',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000952@kopeg-bki.id'),
    '000952@kopeg-bki.id',
    'Deny Cahyo Nugroho, S.T.',
    'member',
    '000952',
    'PRB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000953@kopeg-bki.id'),
    '000953@kopeg-bki.id',
    'Jiadan, S.T.',
    'member',
    '000953',
    'BM',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000954@kopeg-bki.id'),
    '000954@kopeg-bki.id',
    'Muhammad Aris Sultan',
    'member',
    '000954',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000957@kopeg-bki.id'),
    '000957@kopeg-bki.id',
    'Akbar Rakanda Prakasa, S.T.',
    'member',
    '000957',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000959@kopeg-bki.id'),
    '000959@kopeg-bki.id',
    'Vina Nanda Garjati, S.T.',
    'member',
    '000959',
    'DOK',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000964@kopeg-bki.id'),
    '000964@kopeg-bki.id',
    'Rahmi Sartika Permana Dora',
    'member',
    '000964',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000965@kopeg-bki.id'),
    '000965@kopeg-bki.id',
    'Erick Marcos Kiuk',
    'member',
    '000965',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000966@kopeg-bki.id'),
    '000966@kopeg-bki.id',
    'Irsal',
    'member',
    '000966',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000967@kopeg-bki.id'),
    '000967@kopeg-bki.id',
    'Deni',
    'member',
    '000967',
    'BN',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000968@kopeg-bki.id'),
    '000968@kopeg-bki.id',
    'Petrus Jacob Matuankotta',
    'member',
    '000968',
    'SBU ENI',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000969@kopeg-bki.id'),
    '000969@kopeg-bki.id',
    'Muhamad Ardiansyah',
    'member',
    '000969',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000970@kopeg-bki.id'),
    '000970@kopeg-bki.id',
    'Murdiyanta',
    'member',
    '000970',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000971@kopeg-bki.id'),
    '000971@kopeg-bki.id',
    'Syarifuddin Yamin, S.T.',
    'member',
    '000971',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000972@kopeg-bki.id'),
    '000972@kopeg-bki.id',
    'Choirun Cahyoabdi, S.T.',
    'member',
    '000972',
    'CN',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000973@kopeg-bki.id'),
    '000973@kopeg-bki.id',
    'Muhammad Asrul La Saripi, S.T.',
    'member',
    '000973',
    'BM',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000975@kopeg-bki.id'),
    '000975@kopeg-bki.id',
    'M Irfan',
    'member',
    '000975',
    'SBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000976@kopeg-bki.id'),
    '000976@kopeg-bki.id',
    'Guntur Cahyo N, ST',
    'member',
    '000976',
    'SBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000977@kopeg-bki.id'),
    '000977@kopeg-bki.id',
    'Khoirul Asnawi, AMD',
    'member',
    '000977',
    'SBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000978@kopeg-bki.id'),
    '000978@kopeg-bki.id',
    'Riskita Novita Sari',
    'member',
    '000978',
    'SBC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000979@kopeg-bki.id'),
    '000979@kopeg-bki.id',
    'Oki Dwi Anggoro',
    'member',
    '000979',
    'BNC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000981@kopeg-bki.id'),
    '000981@kopeg-bki.id',
    'Abdillah',
    'member',
    '000981',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000982@kopeg-bki.id'),
    '000982@kopeg-bki.id',
    'Kamaruddin',
    'member',
    '000982',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000983@kopeg-bki.id'),
    '000983@kopeg-bki.id',
    'Bari',
    'member',
    '000983',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000984@kopeg-bki.id'),
    '000984@kopeg-bki.id',
    'Adi Ismanto',
    'member',
    '000984',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000986@kopeg-bki.id'),
    '000986@kopeg-bki.id',
    'Rahmat S',
    'member',
    '000986',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000987@kopeg-bki.id'),
    '000987@kopeg-bki.id',
    'M. Hatta Baco B',
    'member',
    '000987',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000988@kopeg-bki.id'),
    '000988@kopeg-bki.id',
    'Ekondro',
    'member',
    '000988',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000989@kopeg-bki.id'),
    '000989@kopeg-bki.id',
    'Rony Wiranto S',
    'member',
    '000989',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000990@kopeg-bki.id'),
    '000990@kopeg-bki.id',
    'Marisa Theresia',
    'member',
    '000990',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000991@kopeg-bki.id'),
    '000991@kopeg-bki.id',
    'Poppy Ayundari',
    'member',
    '000991',
    'SEKPER',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000992@kopeg-bki.id'),
    '000992@kopeg-bki.id',
    'Femmy Anantia Lestari',
    'member',
    '000992',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000993@kopeg-bki.id'),
    '000993@kopeg-bki.id',
    'Rahmawaty',
    'member',
    '000993',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000994@kopeg-bki.id'),
    '000994@kopeg-bki.id',
    'Ahmad Gufran M',
    'member',
    '000994',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000995@kopeg-bki.id'),
    '000995@kopeg-bki.id',
    'Jefry Kurniawan',
    'member',
    '000995',
    'SBU MNO',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000996@kopeg-bki.id'),
    '000996@kopeg-bki.id',
    'La Ode Abdul Rajab Azis',
    'member',
    '000996',
    'SBU MNO',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000997@kopeg-bki.id'),
    '000997@kopeg-bki.id',
    'Sulaeman Mustafa',
    'member',
    '000997',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '000998@kopeg-bki.id'),
    '000998@kopeg-bki.id',
    'Yosua R Palentek,ST',
    'member',
    '000998',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001000@kopeg-bki.id'),
    '001000@kopeg-bki.id',
    'Defi Rizki Mauliani',
    'member',
    '001000',
    'R&P',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001001@kopeg-bki.id'),
    '001001@kopeg-bki.id',
    'Said Taufik',
    'member',
    '001001',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001003@kopeg-bki.id'),
    '001003@kopeg-bki.id',
    'Nur Cahyo Febrianto Putro',
    'member',
    '001003',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001004@kopeg-bki.id'),
    '001004@kopeg-bki.id',
    'Andi Apriadi Awe',
    'member',
    '001004',
    '-',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001006@kopeg-bki.id'),
    '001006@kopeg-bki.id',
    'A. Rasyid Alimuddin',
    'member',
    '001006',
    'PBC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001008@kopeg-bki.id'),
    '001008@kopeg-bki.id',
    'Tunjung Widyatmo H, S.T.',
    'member',
    '001008',
    'PSMMO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001009@kopeg-bki.id'),
    '001009@kopeg-bki.id',
    'Hediar Hapri Bangabua',
    'member',
    '001009',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001010@kopeg-bki.id'),
    '001010@kopeg-bki.id',
    'R Ade Wardoyo',
    'member',
    '001010',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001011@kopeg-bki.id'),
    '001011@kopeg-bki.id',
    'Willem Gerrit Pieter, S.E',
    'member',
    '001011',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001012@kopeg-bki.id'),
    '001012@kopeg-bki.id',
    'Zulfaeni',
    'member',
    '001012',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001013@kopeg-bki.id'),
    '001013@kopeg-bki.id',
    'Rozi Delfemi Irawati',
    'member',
    '001013',
    'PRC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001014@kopeg-bki.id'),
    '001014@kopeg-bki.id',
    'Tantry Octaviani',
    'member',
    '001014',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001016@kopeg-bki.id'),
    '001016@kopeg-bki.id',
    'Adnan',
    'member',
    '001016',
    'BPC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001017@kopeg-bki.id'),
    '001017@kopeg-bki.id',
    'Sudaryono',
    'member',
    '001017',
    'BPC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001018@kopeg-bki.id'),
    '001018@kopeg-bki.id',
    'Zul Fajrin Azdin',
    'member',
    '001018',
    'BT',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001019@kopeg-bki.id'),
    '001019@kopeg-bki.id',
    'Yusriadi',
    'member',
    '001019',
    NULL,
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001021@kopeg-bki.id'),
    '001021@kopeg-bki.id',
    'Dimas Putra Prasetyo',
    'member',
    '001021',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001022@kopeg-bki.id'),
    '001022@kopeg-bki.id',
    'Desi Annike Putri',
    'member',
    '001022',
    'PHP',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001023@kopeg-bki.id'),
    '001023@kopeg-bki.id',
    'Lulu Ufikal Azmi',
    'member',
    '001023',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001024@kopeg-bki.id'),
    '001024@kopeg-bki.id',
    'Rian Eka Saputra',
    'member',
    '001024',
    'PU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001026@kopeg-bki.id'),
    '001026@kopeg-bki.id',
    'Megawati Rosalio Putri',
    'member',
    '001026',
    'PKO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001028@kopeg-bki.id'),
    '001028@kopeg-bki.id',
    'Sudarman /  Budi',
    'member',
    '001028',
    'KOP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001029@kopeg-bki.id'),
    '001029@kopeg-bki.id',
    'Shaidatun Rohmah',
    'member',
    '001029',
    'KOP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001031@kopeg-bki.id'),
    '001031@kopeg-bki.id',
    'Dicky Aldoko',
    'member',
    '001031',
    'TI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001032@kopeg-bki.id'),
    '001032@kopeg-bki.id',
    'Annisyah Fazrin',
    'member',
    '001032',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001033@kopeg-bki.id'),
    '001033@kopeg-bki.id',
    'Riana Patricia',
    'member',
    '001033',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001034@kopeg-bki.id'),
    '001034@kopeg-bki.id',
    'Salma Fadhilah Widityani',
    'member',
    '001034',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001036@kopeg-bki.id'),
    '001036@kopeg-bki.id',
    'Irmarinda Sheyna C',
    'member',
    '001036',
    'MHC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001038@kopeg-bki.id'),
    '001038@kopeg-bki.id',
    'Adesta Munas Latief',
    'member',
    '001038',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001039@kopeg-bki.id'),
    '001039@kopeg-bki.id',
    'Luthfi Setia Mardani',
    'member',
    '001039',
    'SPI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001040@kopeg-bki.id'),
    '001040@kopeg-bki.id',
    'Chrisantya Dian Eka W',
    'member',
    '001040',
    'MRKU',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001041@kopeg-bki.id'),
    '001041@kopeg-bki.id',
    'N. Karindita Ekibdwi Putri',
    'member',
    '001041',
    'MS',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001042@kopeg-bki.id'),
    '001042@kopeg-bki.id',
    'Abdil Hafizh Zhafran',
    'member',
    '001042',
    'PKO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001043@kopeg-bki.id'),
    '001043@kopeg-bki.id',
    'Aldicio William Schuurman',
    'member',
    '001043',
    'DMP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001044@kopeg-bki.id'),
    '001044@kopeg-bki.id',
    'Kevin Iqbal Rizaldi',
    'member',
    '001044',
    'LC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001045@kopeg-bki.id'),
    '001045@kopeg-bki.id',
    'Faishal Abdurrahman Labib',
    'member',
    '001045',
    'DOK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001046@kopeg-bki.id'),
    '001046@kopeg-bki.id',
    'Aditya Putri Anggraini',
    'member',
    '001046',
    'PUMA',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001047@kopeg-bki.id'),
    '001047@kopeg-bki.id',
    'Muhammad Irvan Widya',
    'member',
    '001047',
    'SPI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001048@kopeg-bki.id'),
    '001048@kopeg-bki.id',
    'Muhammad Rio',
    'member',
    '001048',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001050@kopeg-bki.id'),
    '001050@kopeg-bki.id',
    'Harry Santoso',
    'member',
    '001050',
    NULL,
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001058@kopeg-bki.id'),
    '001058@kopeg-bki.id',
    'Henky Prabowo',
    'member',
    '001058',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001059@kopeg-bki.id'),
    '001059@kopeg-bki.id',
    'Sudirman Majid',
    'member',
    '001059',
    'DOC',
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001060@kopeg-bki.id'),
    '001060@kopeg-bki.id',
    'Yosida Isdianawati',
    'member',
    '001060',
    'KOP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001061@kopeg-bki.id'),
    '001061@kopeg-bki.id',
    'Andre L Latuihamalo',
    'member',
    '001061',
    NULL,
    false
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001062@kopeg-bki.id'),
    '001062@kopeg-bki.id',
    'Abd. Rahman ST',
    'member',
    '001062',
    'BNC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001063@kopeg-bki.id'),
    '001063@kopeg-bki.id',
    'Ratna Damayanti',
    'member',
    '001063',
    'BPC',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001064@kopeg-bki.id'),
    '001064@kopeg-bki.id',
    'Aldi Muhammad Rianto',
    'member',
    '001064',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001065@kopeg-bki.id'),
    '001065@kopeg-bki.id',
    'Aldi Wahyu Prasetyo',
    'member',
    '001065',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001066@kopeg-bki.id'),
    '001066@kopeg-bki.id',
    'Iqbal Rezky',
    'member',
    '001066',
    'SBU ENI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001069@kopeg-bki.id'),
    '001069@kopeg-bki.id',
    'Ade Sintya Kusumawardani',
    'member',
    '001069',
    'SEKPER',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001070@kopeg-bki.id'),
    '001070@kopeg-bki.id',
    'Rozainbahri Noor',
    'member',
    '001070',
    'DIREKSI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001072@kopeg-bki.id'),
    '001072@kopeg-bki.id',
    'Nadia Listiyani',
    'member',
    '001072',
    'PKK',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001073@kopeg-bki.id'),
    '001073@kopeg-bki.id',
    'Faried, ST',
    'member',
    '001073',
    'SBU MNO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001074@kopeg-bki.id'),
    '001074@kopeg-bki.id',
    'Arisudono Soerono',
    'member',
    '001074',
    'DIREKSI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001075@kopeg-bki.id'),
    '001075@kopeg-bki.id',
    'Benny Susanto',
    'member',
    '001075',
    'DIREKSI',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001081@kopeg-bki.id'),
    '001081@kopeg-bki.id',
    'Agus Syarif Maolana',
    'member',
    '001081',
    'ISPB',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001082@kopeg-bki.id'),
    '001082@kopeg-bki.id',
    'Bakti Nugroho Dwi Kushadianto',
    'member',
    '001082',
    'SV',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001083@kopeg-bki.id'),
    '001083@kopeg-bki.id',
    'Wildanis Miftahul Abror',
    'member',
    '001083',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001084@kopeg-bki.id'),
    '001084@kopeg-bki.id',
    'Abdul Rifani Praja Nurrahman',
    'member',
    '001084',
    'AKP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001085@kopeg-bki.id'),
    '001085@kopeg-bki.id',
    'Farhan Abdul Karim',
    'member',
    '001085',
    'TP',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001086@kopeg-bki.id'),
    '001086@kopeg-bki.id',
    'Muhtar',
    'member',
    '001086',
    'HCTIO',
    true
  ),
  (
    (SELECT id::text FROM auth.users WHERE email = '001087@kopeg-bki.id'),
    '001087@kopeg-bki.id',
    'Ibnul Qayyim',
    'member',
    '001087',
    'BT',
    true
  )
ON CONFLICT (email) DO UPDATE SET
  full_name   = EXCLUDED.full_name,
  employee_id = EXCLUDED.employee_id,
  department  = EXCLUDED.department,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Insert savings records for period 2024-12
-- References users by employee_id lookup.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO savings (user_id, period, simpanan_pokok, simpanan_wajib, simpanan_khusus, simpanan_sukarela, shu, total_balance)
VALUES
  (
    (SELECT id FROM users WHERE employee_id = '000001'),
    '2024-12',
    5000.00,
    17240660.00,
    0.00,
    1997221.99,
    0.00,
    19242881.99
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000006'),
    '2024-12',
    5000.00,
    10609532.00,
    0.00,
    1217315.68,
    0.00,
    11831847.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000009'),
    '2024-12',
    5000.00,
    24852898.00,
    795000.00,
    2229525.29,
    0.00,
    27882423.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000013'),
    '2024-12',
    5000.00,
    37699463.00,
    37500.00,
    15062212.81,
    0.00,
    52804175.81
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000014'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    250663.25,
    0.00,
    250663.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000015'),
    '2024-12',
    5000.00,
    34674262.00,
    0.00,
    5114337.20,
    0.00,
    39793599.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000018'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    655986.00,
    0.00,
    655986.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000019'),
    '2024-12',
    0.00,
    250000.00,
    100000.00,
    214116.94,
    0.00,
    564116.94
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000020'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    178433.00,
    0.00,
    178433.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000025'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    2245019.00,
    0.00,
    2245019.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000026'),
    '2024-12',
    5000.00,
    44697275.00,
    0.00,
    4257094.69,
    0.00,
    48959369.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000027'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    131136.88,
    0.00,
    131136.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000030'),
    '2024-12',
    5000.00,
    77549876.00,
    347500.00,
    11842161.65,
    0.00,
    89744537.65
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000032'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    6374025.00,
    0.00,
    6374025.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000033'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    93974.01,
    0.00,
    93974.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000037'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    10257.86,
    0.00,
    260257.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000043'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    91043.70,
    0.00,
    91043.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000044'),
    '2024-12',
    5000.00,
    13231788.00,
    535000.00,
    1783497.35,
    0.00,
    15555285.35
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000045'),
    '2024-12',
    0.00,
    800000.00,
    0.00,
    168972.28,
    0.00,
    968972.28
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000048'),
    '2024-12',
    5000.00,
    18900000.00,
    0.00,
    3875093.39,
    0.00,
    22780093.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000052'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    758204.00,
    0.00,
    758204.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000053'),
    '2024-12',
    200000.00,
    4600000.00,
    0.00,
    287113.34,
    0.00,
    5087113.34
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000056'),
    '2024-12',
    5000.00,
    67026138.00,
    100000.00,
    19727391.22,
    0.00,
    86858529.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000059'),
    '2024-12',
    5000.00,
    12814161.00,
    0.00,
    6717668.68,
    0.00,
    19536829.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000060'),
    '2024-12',
    5000.00,
    26027980.00,
    0.00,
    2979690.51,
    0.00,
    29012670.51
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000062'),
    '2024-12',
    5000.00,
    47029884.00,
    0.00,
    8565906.68,
    0.00,
    55600790.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000064'),
    '2024-12',
    5000.00,
    40939498.00,
    0.00,
    3956525.82,
    0.00,
    44901023.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000065'),
    '2024-12',
    5000.00,
    25567478.00,
    0.00,
    3299412.14,
    0.00,
    28871890.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000067'),
    '2024-12',
    5000.00,
    39095000.00,
    650000.00,
    2945305.34,
    0.00,
    42695305.34
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000070'),
    '2024-12',
    5000.00,
    36018134.00,
    375000.00,
    4081046.07,
    0.00,
    40479180.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000071'),
    '2024-12',
    5000.00,
    52878542.00,
    50000.00,
    7896834.37,
    0.00,
    60830376.37
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000072'),
    '2024-12',
    5000.00,
    3375000.00,
    0.00,
    2064898.07,
    0.00,
    5444898.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000075'),
    '2024-12',
    5000.00,
    19034067.00,
    0.00,
    2827924.87,
    0.00,
    21866991.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000076'),
    '2024-12',
    10000.00,
    27913302.00,
    0.00,
    7707068.41,
    0.00,
    35630370.41
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000081'),
    '2024-12',
    5000.00,
    71130464.00,
    0.00,
    16262091.68,
    0.00,
    87397555.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000083'),
    '2024-12',
    0.00,
    -450000.00,
    0.00,
    3247063.00,
    0.00,
    2797063.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000084'),
    '2024-12',
    5000.00,
    21995858.00,
    990000.00,
    770309.50,
    0.00,
    23761167.50
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000085'),
    '2024-12',
    5000.00,
    345000.00,
    0.00,
    641073.39,
    0.00,
    991073.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000086'),
    '2024-12',
    5000.00,
    55171058.00,
    50000.00,
    19427158.08,
    0.00,
    74653216.08
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000088'),
    '2024-12',
    5000.00,
    36191147.00,
    1310000.00,
    4118217.29,
    0.00,
    41624364.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000089'),
    '2024-12',
    0.00,
    300000.00,
    0.00,
    115593.92,
    0.00,
    415593.92
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000091'),
    '2024-12',
    5000.00,
    52884577.00,
    0.00,
    2074051.61,
    0.00,
    54963628.61
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000094'),
    '2024-12',
    5000.00,
    23678235.00,
    0.00,
    8738803.15,
    0.00,
    32422038.15
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000095'),
    '2024-12',
    5000.00,
    195000.00,
    0.00,
    366059.09,
    0.00,
    566059.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000096'),
    '2024-12',
    5000.00,
    37815979.00,
    0.00,
    4709402.14,
    0.00,
    42530381.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000097'),
    '2024-12',
    5000.00,
    0.00,
    10000.00,
    615.00,
    0.00,
    15615.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000099'),
    '2024-12',
    5000.00,
    33725000.00,
    0.00,
    5619075.09,
    0.00,
    39349075.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000100'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    360016.29,
    0.00,
    510016.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000101'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    2689342.00,
    0.00,
    2689342.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000103'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    158480.00,
    0.00,
    158480.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000111'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    187636.02,
    0.00,
    187636.02
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000112'),
    '2024-12',
    5000.00,
    5919993.00,
    0.00,
    361804.25,
    0.00,
    6286797.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000114'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    98501.94,
    0.00,
    248501.94
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000116'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    257415.91,
    0.00,
    257415.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000117'),
    '2024-12',
    5000.00,
    29511013.00,
    210000.00,
    2729941.07,
    0.00,
    32455954.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000119'),
    '2024-12',
    5000.00,
    30694515.00,
    50000.00,
    12608748.76,
    0.00,
    43358263.76
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000120'),
    '2024-12',
    0.00,
    350000.00,
    0.00,
    36242.00,
    0.00,
    386242.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000121'),
    '2024-12',
    5000.00,
    42684477.00,
    10000.00,
    7956586.55,
    0.00,
    50656063.55
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000122'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    172826.48,
    0.00,
    172826.48
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000123'),
    '2024-12',
    5000.00,
    20633939.00,
    0.00,
    3095747.86,
    0.00,
    23734686.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000124'),
    '2024-12',
    5000.00,
    25614881.00,
    980000.00,
    4460457.74,
    0.00,
    31060338.74
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000125'),
    '2024-12',
    5000.00,
    4352980.00,
    150000.00,
    2820477.44,
    0.00,
    7328457.44
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000126'),
    '2024-12',
    5000.00,
    38482113.00,
    0.00,
    12746806.79,
    0.00,
    51233919.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000127'),
    '2024-12',
    5000.00,
    724127.00,
    71000.00,
    3473214.92,
    0.00,
    4273341.92
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000128'),
    '2024-12',
    5000.00,
    21957208.00,
    0.00,
    5410693.05,
    0.00,
    27372901.05
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000129'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    4103.00,
    0.00,
    104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000130'),
    '2024-12',
    5000.00,
    31407578.00,
    0.00,
    13916181.89,
    0.00,
    45328759.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000131'),
    '2024-12',
    5000.00,
    34964030.00,
    35000.00,
    10927885.32,
    0.00,
    45931915.32
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000133'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    129439.66,
    0.00,
    129439.66
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000135'),
    '2024-12',
    5000.00,
    20816599.00,
    75000.00,
    6255673.33,
    0.00,
    27152272.33
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000136'),
    '2024-12',
    5000.00,
    16198751.00,
    1203500.00,
    1092341.64,
    0.00,
    18499592.64
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000139'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    301678.77,
    0.00,
    301678.77
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000141'),
    '2024-12',
    5000.00,
    3741961.00,
    8100.00,
    8509881.30,
    0.00,
    12264942.30
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000142'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    212760.00,
    0.00,
    212760.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000143'),
    '2024-12',
    200000.00,
    9100000.00,
    0.00,
    355462.48,
    0.00,
    9655462.48
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000144'),
    '2024-12',
    5000.00,
    3417478.00,
    0.00,
    2706538.14,
    0.00,
    6129016.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000145'),
    '2024-12',
    5000.00,
    145000.00,
    0.00,
    609776.88,
    0.00,
    759776.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000148'),
    '2024-12',
    5000.00,
    18145000.00,
    25000.00,
    878616.03,
    0.00,
    19053616.03
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000149'),
    '2024-12',
    5000.00,
    39237174.00,
    1277000.00,
    3916195.08,
    0.00,
    44435369.08
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000150'),
    '2024-12',
    5000.00,
    9252980.00,
    0.00,
    4034408.26,
    0.00,
    13292388.26
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000152'),
    '2024-12',
    5000.00,
    7746114.00,
    0.00,
    5220610.77,
    0.00,
    12971724.77
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000153'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    127872.24,
    0.00,
    127872.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000156'),
    '2024-12',
    5000.00,
    11460815.00,
    0.00,
    13884342.21,
    0.00,
    25350157.21
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000157'),
    '2024-12',
    5000.00,
    25443744.00,
    810000.00,
    2368118.22,
    0.00,
    28626862.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000160'),
    '2024-12',
    5000.00,
    46310800.00,
    85000.00,
    8039914.11,
    0.00,
    54440714.11
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000162'),
    '2024-12',
    5000.00,
    59261930.00,
    1103000.00,
    5795464.90,
    0.00,
    66165394.90
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000163'),
    '2024-12',
    5000.00,
    36804821.00,
    220000.00,
    4452782.74,
    0.00,
    41482603.74
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000164'),
    '2024-12',
    5000.00,
    21770858.00,
    910000.00,
    2666764.47,
    0.00,
    25352622.47
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000165'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    1762733.00,
    0.00,
    1762733.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000166'),
    '2024-12',
    0.00,
    1050000.00,
    0.00,
    143421.94,
    0.00,
    1193421.94
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000167'),
    '2024-12',
    5000.00,
    24036013.00,
    40000.00,
    2105839.64,
    0.00,
    26186852.64
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000168'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    780921.00,
    0.00,
    780921.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000169'),
    '2024-12',
    5000.00,
    13686528.00,
    0.00,
    28435597.92,
    0.00,
    42127125.92
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000170'),
    '2024-12',
    5000.00,
    39775160.00,
    0.00,
    13387892.85,
    0.00,
    53168052.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000172'),
    '2024-12',
    5000.00,
    35639498.00,
    0.00,
    3518535.62,
    0.00,
    39163033.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000175'),
    '2024-12',
    5000.00,
    35058538.00,
    650000.00,
    3482005.91,
    0.00,
    39195543.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000178'),
    '2024-12',
    0.00,
    300000.00,
    0.00,
    234774.19,
    0.00,
    534774.19
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000179'),
    '2024-12',
    5000.00,
    3689498.00,
    0.00,
    3721789.92,
    0.00,
    7416287.92
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000180'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    1916748.72,
    0.00,
    1916748.72
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000181'),
    '2024-12',
    5000.00,
    36529733.00,
    1422000.00,
    1255578.25,
    0.00,
    39212311.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000183'),
    '2024-12',
    5000.00,
    45191972.00,
    645000.00,
    4640303.75,
    0.00,
    50482275.75
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000184'),
    '2024-12',
    5000.00,
    38111918.00,
    670000.00,
    1296338.50,
    0.00,
    40083256.50
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000187'),
    '2024-12',
    5000.00,
    670000.00,
    0.00,
    1243320.98,
    0.00,
    1918320.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000191'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    50527.97,
    0.00,
    50527.97
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000192'),
    '2024-12',
    5000.00,
    30840660.00,
    2850000.00,
    2466878.84,
    0.00,
    36162538.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000194'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    207929.08,
    0.00,
    207929.08
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000195'),
    '2024-12',
    0.00,
    350000.00,
    0.00,
    745156.26,
    0.00,
    1095156.26
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000196'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    80944.01,
    0.00,
    80944.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000197'),
    '2024-12',
    5000.00,
    38053066.00,
    850000.00,
    5340496.36,
    0.00,
    44248562.36
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000198'),
    '2024-12',
    5000.00,
    38491804.00,
    210000.00,
    4727823.22,
    0.00,
    43434627.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000199'),
    '2024-12',
    5000.00,
    68123471.00,
    50000.00,
    10670025.70,
    0.00,
    78848496.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000203'),
    '2024-12',
    5000.00,
    24576609.00,
    1813000.00,
    2229527.77,
    0.00,
    28624136.77
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000205'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    112648.17,
    0.00,
    362648.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000206'),
    '2024-12',
    5000.00,
    21995858.00,
    0.00,
    2386307.65,
    0.00,
    24387165.65
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000207'),
    '2024-12',
    5000.00,
    21845858.00,
    0.00,
    2677427.89,
    0.00,
    24528285.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000208'),
    '2024-12',
    5000.00,
    49092861.00,
    585000.00,
    5705906.58,
    0.00,
    55388767.58
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000210'),
    '2024-12',
    5000.00,
    19853973.00,
    50000.00,
    1529471.99,
    0.00,
    21438444.99
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000211'),
    '2024-12',
    5000.00,
    23989161.00,
    50000.00,
    3440312.07,
    0.00,
    27484473.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000212'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    8379.00,
    0.00,
    8379.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000213'),
    '2024-12',
    5000.00,
    545000.00,
    0.00,
    1078286.12,
    0.00,
    1628286.12
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000216'),
    '2024-12',
    5000.00,
    25114242.00,
    2078000.00,
    2260129.22,
    0.00,
    29457371.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000217'),
    '2024-12',
    5000.00,
    19584532.00,
    30000.00,
    2319199.66,
    0.00,
    21938731.66
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000219'),
    '2024-12',
    5000.00,
    21414667.00,
    0.00,
    5677074.70,
    0.00,
    27096741.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000222'),
    '2024-12',
    5000.00,
    21845858.00,
    0.00,
    2361268.13,
    0.00,
    24212126.13
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000223'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    99564.00,
    0.00,
    99564.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000225'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    2164049.00,
    0.00,
    2164049.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000227'),
    '2024-12',
    5000.00,
    4425000.00,
    0.00,
    567722.78,
    0.00,
    4997722.78
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000230'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    28633.09,
    0.00,
    278633.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000232'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    81586.06,
    0.00,
    81586.06
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000233'),
    '2024-12',
    5000.00,
    55483869.00,
    0.00,
    9947618.88,
    0.00,
    65436487.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000234'),
    '2024-12',
    5000.00,
    16042646.00,
    0.00,
    2906244.38,
    0.00,
    18953890.38
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000235'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    123468.73,
    0.00,
    123468.73
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000236'),
    '2024-12',
    5000.00,
    22885147.00,
    565000.00,
    8473635.68,
    0.00,
    31928782.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000239'),
    '2024-12',
    5000.00,
    65091653.00,
    95000.00,
    2977349.30,
    0.00,
    68169002.30
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000240'),
    '2024-12',
    5000.00,
    53443284.00,
    80000.00,
    2737463.57,
    0.00,
    56265747.57
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000242'),
    '2024-12',
    5000.00,
    36500255.00,
    0.00,
    4392305.31,
    0.00,
    40897560.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000243'),
    '2024-12',
    5000.00,
    24056743.00,
    1057500.00,
    1337749.69,
    0.00,
    26456992.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000249'),
    '2024-12',
    5000.00,
    23892478.00,
    0.00,
    1194747.99,
    0.00,
    25092225.99
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000250'),
    '2024-12',
    5000.00,
    26399256.00,
    604000.00,
    2672491.44,
    0.00,
    29680747.44
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000251'),
    '2024-12',
    5000.00,
    900000.00,
    0.00,
    846346.50,
    0.00,
    1751346.50
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000254'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    730532.00,
    0.00,
    730532.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000255'),
    '2024-12',
    5000.00,
    445000.00,
    0.00,
    837939.53,
    0.00,
    1287939.53
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000256'),
    '2024-12',
    5000.00,
    18759933.00,
    0.00,
    3730362.33,
    0.00,
    22495295.33
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000257'),
    '2024-12',
    5000.00,
    22440323.00,
    285000.00,
    1554610.87,
    0.00,
    24284933.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000258'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    0.01,
    0.00,
    0.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000259'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    42436.96,
    0.00,
    42436.96
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000263'),
    '2024-12',
    5000.00,
    28825000.00,
    0.00,
    5148806.69,
    0.00,
    33978806.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000264'),
    '2024-12',
    5000.00,
    44528397.00,
    854000.00,
    4186156.26,
    0.00,
    49573553.26
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000265'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    1666022.00,
    0.00,
    1816022.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000266'),
    '2024-12',
    5000.00,
    60000.00,
    0.00,
    243547.11,
    0.00,
    308547.11
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000268'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    29551.51,
    0.00,
    29551.51
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000270'),
    '2024-12',
    5000.00,
    370000.00,
    0.00,
    188890.37,
    0.00,
    563890.37
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000276'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    103178.31,
    0.00,
    103178.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000277'),
    '2024-12',
    5000.00,
    1877980.00,
    0.00,
    1808479.04,
    0.00,
    3691459.04
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000279'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    84064.02,
    0.00,
    234064.02
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000283'),
    '2024-12',
    5000.00,
    25242036.00,
    220000.00,
    3975625.34,
    0.00,
    29442661.34
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000285'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    859479.00,
    0.00,
    859479.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000289'),
    '2024-12',
    5000.00,
    13750000.00,
    0.00,
    4140700.00,
    0.00,
    17895700.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000291'),
    '2024-12',
    5000.00,
    21095858.00,
    880000.00,
    2590649.52,
    0.00,
    24571507.52
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000292'),
    '2024-12',
    5000.00,
    45192947.00,
    30000.00,
    4251986.88,
    0.00,
    49479933.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000298'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    279251.14,
    0.00,
    279251.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000299'),
    '2024-12',
    5000.00,
    41697316.00,
    1125000.00,
    5871373.67,
    0.00,
    48698689.67
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000300'),
    '2024-12',
    5000.00,
    30687151.00,
    2196000.00,
    6466856.86,
    0.00,
    39355007.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000302'),
    '2024-12',
    5000.00,
    22739393.00,
    200000.00,
    8112913.13,
    0.00,
    31057306.13
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000304'),
    '2024-12',
    5000.00,
    34526249.00,
    1050000.00,
    2363296.17,
    0.00,
    37944545.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000305'),
    '2024-12',
    5000.00,
    31047025.00,
    0.00,
    12220289.76,
    0.00,
    43272314.76
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000307'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    394969.29,
    0.00,
    644969.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000308'),
    '2024-12',
    5000.00,
    14325000.00,
    0.00,
    4781035.21,
    0.00,
    19111035.21
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000309'),
    '2024-12',
    0.00,
    14250000.00,
    440000.00,
    483596.86,
    0.00,
    15173596.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000310'),
    '2024-12',
    0.00,
    3150000.00,
    0.00,
    236140.24,
    0.00,
    3386140.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000312'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    10258.12,
    0.00,
    260258.12
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000315'),
    '2024-12',
    5000.00,
    495000.00,
    0.00,
    150221.40,
    0.00,
    650221.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000317'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    45074.09,
    0.00,
    45074.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000321'),
    '2024-12',
    5000.00,
    36877980.00,
    0.00,
    2909714.24,
    0.00,
    39792694.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000322'),
    '2024-12',
    5000.00,
    32380222.00,
    1240000.00,
    3023925.69,
    0.00,
    36649147.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000323'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    139220.39,
    0.00,
    139220.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000324'),
    '2024-12',
    5000.00,
    41869812.00,
    87500.00,
    7671851.37,
    0.00,
    49634163.37
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000327'),
    '2024-12',
    5000.00,
    55000.00,
    0.00,
    309191.91,
    0.00,
    369191.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000329'),
    '2024-12',
    5000.00,
    34855222.00,
    175000.00,
    2345382.54,
    0.00,
    37380604.54
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000331'),
    '2024-12',
    5000.00,
    29606383.00,
    2490000.00,
    2465854.42,
    0.00,
    34567237.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000333'),
    '2024-12',
    5000.00,
    4350000.00,
    0.00,
    650344.32,
    0.00,
    5005344.32
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000334'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    200217.27,
    0.00,
    200217.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000336'),
    '2024-12',
    5000.00,
    145000.00,
    0.00,
    590481.22,
    0.00,
    740481.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000337'),
    '2024-12',
    5000.00,
    72800.00,
    0.00,
    412039.85,
    0.00,
    489839.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000338'),
    '2024-12',
    5000.00,
    36345858.00,
    0.00,
    2954633.57,
    0.00,
    39305491.57
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000340'),
    '2024-12',
    5000.00,
    36621642.00,
    30000.00,
    1200724.34,
    0.00,
    37857366.34
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000341'),
    '2024-12',
    5000.00,
    25200447.00,
    550000.00,
    2131892.54,
    0.00,
    27887339.54
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000342'),
    '2024-12',
    5000.00,
    29016000.00,
    200000.00,
    2030516.69,
    0.00,
    31251516.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000345'),
    '2024-12',
    5000.00,
    12425457.00,
    0.00,
    12177051.67,
    0.00,
    24607508.67
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000348'),
    '2024-12',
    5000.00,
    41972107.00,
    30000.00,
    5675768.27,
    0.00,
    47682875.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000351'),
    '2024-12',
    5000.00,
    21502980.00,
    0.00,
    3714498.84,
    0.00,
    25222478.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000352'),
    '2024-12',
    0.00,
    950000.00,
    0.00,
    38978.62,
    0.00,
    988978.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000353'),
    '2024-12',
    0.00,
    1550000.00,
    0.00,
    63598.27,
    0.00,
    1613598.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000354'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    282933.32,
    0.00,
    282933.32
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000362'),
    '2024-12',
    5000.00,
    53986636.00,
    360000.00,
    5343888.84,
    0.00,
    59695524.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000363'),
    '2024-12',
    5000.00,
    33306004.00,
    0.00,
    9825385.35,
    0.00,
    43136389.35
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000364'),
    '2024-12',
    5000.00,
    16720845.00,
    0.00,
    623064.30,
    0.00,
    17348909.30
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000365'),
    '2024-12',
    5000.00,
    18009933.00,
    0.00,
    1777789.16,
    0.00,
    19792722.16
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000366'),
    '2024-12',
    5000.00,
    345000.00,
    0.00,
    640254.17,
    0.00,
    990254.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000367'),
    '2024-12',
    5000.00,
    47592141.00,
    0.00,
    4438329.79,
    0.00,
    52035470.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000369'),
    '2024-12',
    5000.00,
    34342879.00,
    0.00,
    3019774.96,
    0.00,
    37367653.96
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000370'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    1621361.00,
    0.00,
    1621361.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000376'),
    '2024-12',
    0.00,
    750000.00,
    0.00,
    30773.45,
    0.00,
    780773.45
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000378'),
    '2024-12',
    0.00,
    550000.00,
    0.00,
    12309.00,
    0.00,
    562309.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000379'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    275367.87,
    0.00,
    275367.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000382'),
    '2024-12',
    5000.00,
    25999750.00,
    70000.00,
    13802713.89,
    0.00,
    39877463.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000383'),
    '2024-12',
    5000.00,
    4942309.00,
    0.00,
    5525666.05,
    0.00,
    10472975.05
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000384'),
    '2024-12',
    5000.00,
    22825000.00,
    0.00,
    2370200.42,
    0.00,
    25200200.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000385'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    363077.00,
    0.00,
    363077.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000387'),
    '2024-12',
    5000.00,
    7828200.00,
    60000.00,
    2253267.77,
    0.00,
    10146467.77
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000388'),
    '2024-12',
    5000.00,
    19675000.00,
    0.00,
    1853460.18,
    0.00,
    21533460.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000390'),
    '2024-12',
    5000.00,
    77857727.00,
    796000.00,
    14068477.86,
    0.00,
    92727204.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000392'),
    '2024-12',
    5000.00,
    38094022.00,
    25000.00,
    5371053.79,
    0.00,
    43495075.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000393'),
    '2024-12',
    5000.00,
    22650255.00,
    0.00,
    5193689.03,
    0.00,
    27848944.03
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000394'),
    '2024-12',
    5000.00,
    16709933.00,
    150000.00,
    3162948.30,
    0.00,
    20027881.30
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000395'),
    '2024-12',
    5000.00,
    34799256.00,
    3425000.00,
    1279147.11,
    0.00,
    39508403.11
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000396'),
    '2024-12',
    5000.00,
    22313505.00,
    250000.00,
    2763340.55,
    0.00,
    25331845.55
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000397'),
    '2024-12',
    5000.00,
    15389498.00,
    0.00,
    7495297.83,
    0.00,
    22889795.83
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000398'),
    '2024-12',
    5000.00,
    25550000.00,
    0.00,
    2343699.15,
    0.00,
    27898699.15
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000402'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    1442610.00,
    0.00,
    1442610.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000404'),
    '2024-12',
    5000.00,
    9750000.00,
    0.00,
    838269.14,
    0.00,
    10593269.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000408'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    146800.93,
    0.00,
    146800.93
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000411'),
    '2024-12',
    5000.00,
    55000.00,
    0.00,
    341563.78,
    0.00,
    401563.78
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000412'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    155664.78,
    0.00,
    155664.78
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000413'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    3466839.00,
    0.00,
    3466839.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000414'),
    '2024-12',
    5000.00,
    16704146.00,
    1300000.00,
    411238.19,
    0.00,
    18420384.19
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000417'),
    '2024-12',
    5000.00,
    41104126.00,
    1490000.00,
    10472140.18,
    0.00,
    53071266.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000419'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    110201.96,
    0.00,
    110201.96
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000420'),
    '2024-12',
    5000.00,
    24786773.00,
    2115000.00,
    3728976.83,
    0.00,
    30635749.83
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000421'),
    '2024-12',
    5000.00,
    62397002.00,
    535000.00,
    5889520.00,
    0.00,
    68826522.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000422'),
    '2024-12',
    5000.00,
    46347002.00,
    0.00,
    4839277.21,
    0.00,
    51191279.21
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000423'),
    '2024-12',
    5000.00,
    25665346.00,
    595000.00,
    2652424.72,
    0.00,
    28917770.72
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000426'),
    '2024-12',
    5000.00,
    25923960.00,
    1285000.00,
    2412305.81,
    0.00,
    29626265.81
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000428'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    -599999.93,
    0.00,
    -599999.93
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000430'),
    '2024-12',
    5000.00,
    21920858.00,
    60000.00,
    2353773.89,
    0.00,
    24339631.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000431'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    10257.51,
    0.00,
    260257.51
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000432'),
    '2024-12',
    5000.00,
    34522362.00,
    15000.00,
    5852647.90,
    0.00,
    40395009.90
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000434'),
    '2024-12',
    5000.00,
    22145858.00,
    400000.00,
    746055.98,
    0.00,
    23296913.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000437'),
    '2024-12',
    0.00,
    270000.00,
    0.00,
    121012.31,
    0.00,
    391012.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000439'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    143401.14,
    0.00,
    143401.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000440'),
    '2024-12',
    5000.00,
    37345858.00,
    0.00,
    3137721.60,
    0.00,
    40488579.60
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000442'),
    '2024-12',
    5000.00,
    63164163.00,
    760000.00,
    14346179.20,
    0.00,
    78275342.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000443'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    489102.91,
    0.00,
    489102.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000446'),
    '2024-12',
    5000.00,
    22350424.00,
    30000.00,
    2602680.49,
    0.00,
    24988104.49
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000447'),
    '2024-12',
    5000.00,
    18700000.00,
    1560000.00,
    1527669.47,
    0.00,
    21792669.47
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000448'),
    '2024-12',
    5000.00,
    30252410.00,
    2670000.00,
    1006873.58,
    0.00,
    33934283.58
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000449'),
    '2024-12',
    5000.00,
    31425000.00,
    100000.00,
    2192346.43,
    0.00,
    33722346.43
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000451'),
    '2024-12',
    0.00,
    200000.00,
    0.00,
    20710.00,
    0.00,
    220710.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000453'),
    '2024-12',
    5000.00,
    56009170.00,
    930000.00,
    20651531.81,
    0.00,
    77595701.81
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000459'),
    '2024-12',
    5000.00,
    22656215.00,
    680000.00,
    3002667.32,
    0.00,
    26343882.32
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000460'),
    '2024-12',
    5000.00,
    17378868.00,
    0.00,
    3414681.17,
    0.00,
    20798549.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000463'),
    '2024-12',
    205000.00,
    43920000.00,
    250000.00,
    4128513.43,
    0.00,
    48503513.43
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000464'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    4102.93,
    0.00,
    104102.93
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000465'),
    '2024-12',
    5000.00,
    295000.00,
    0.00,
    526766.17,
    0.00,
    826766.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000466'),
    '2024-12',
    0.00,
    0.00,
    -190000.00,
    -185128.46,
    0.00,
    -375128.46
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000467'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    10354.00,
    0.00,
    110354.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000468'),
    '2024-12',
    5000.00,
    20413906.00,
    2395000.00,
    1849297.11,
    0.00,
    24663203.11
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000469'),
    '2024-12',
    5000.00,
    5845353.00,
    0.00,
    7276039.18,
    0.00,
    13126392.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000470'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    10443.98,
    0.00,
    10443.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000471'),
    '2024-12',
    5000.00,
    28817111.00,
    10000.00,
    8764071.13,
    0.00,
    37596182.13
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000472'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    3988.81,
    0.00,
    3988.81
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000474'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    37483.00,
    0.00,
    37483.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000476'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    4103.00,
    0.00,
    104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000477'),
    '2024-12',
    5000.00,
    21269063.00,
    1230000.00,
    2755095.79,
    0.00,
    25259158.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000479'),
    '2024-12',
    5000.00,
    34723838.00,
    0.00,
    3099397.29,
    0.00,
    37828235.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000481'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    556645.51,
    0.00,
    556645.51
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000482'),
    '2024-12',
    5000.00,
    47548200.00,
    60000.00,
    5491723.48,
    0.00,
    53104923.48
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000485'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    4707.00,
    0.00,
    4707.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000487'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    3241.00,
    0.00,
    3241.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000494'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    10258.00,
    0.00,
    260258.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000495'),
    '2024-12',
    5000.00,
    26219336.00,
    3057500.00,
    3467644.33,
    0.00,
    32749480.33
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000498'),
    '2024-12',
    0.00,
    0.00,
    150000.00,
    6155.00,
    0.00,
    156155.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000499'),
    '2024-12',
    0.00,
    700000.00,
    0.00,
    18689.95,
    0.00,
    718689.95
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000500'),
    '2024-12',
    5000.00,
    50012250.00,
    10000.00,
    12385541.13,
    0.00,
    62412791.13
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000501'),
    '2024-12',
    5000.00,
    25623756.00,
    595000.00,
    4637557.48,
    0.00,
    30861313.48
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000502'),
    '2024-12',
    0.00,
    500000.00,
    0.00,
    1573475.41,
    0.00,
    2073475.41
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000505'),
    '2024-12',
    5000.00,
    2336518.00,
    0.00,
    2636111.43,
    0.00,
    4977629.43
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000506'),
    '2024-12',
    5000.00,
    19084520.00,
    2810000.00,
    5777277.84,
    0.00,
    27676797.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000507'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    215198.84,
    0.00,
    215198.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000510'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    935.63,
    0.00,
    935.63
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000511'),
    '2024-12',
    5000.00,
    18995858.00,
    50000.00,
    1220176.70,
    0.00,
    20271034.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000512'),
    '2024-12',
    5000.00,
    75147982.00,
    740000.00,
    8930347.17,
    0.00,
    84823329.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000513'),
    '2024-12',
    0.00,
    1650000.00,
    0.00,
    36928.26,
    0.00,
    1686928.26
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000514'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    340843.00,
    0.00,
    340843.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000515'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    95488.28,
    0.00,
    95488.28
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000517'),
    '2024-12',
    5000.00,
    26544922.00,
    786500.00,
    2825162.75,
    0.00,
    30161584.75
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000518'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    122791.89,
    0.00,
    122791.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000519'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    129405.06,
    0.00,
    129405.06
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000520'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    278705.68,
    0.00,
    428705.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000521'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    434355.52,
    0.00,
    434355.52
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000522'),
    '2024-12',
    5000.00,
    19071897.00,
    2174000.00,
    2550691.82,
    0.00,
    23801588.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000524'),
    '2024-12',
    5000.00,
    34438168.00,
    30000.00,
    8817912.68,
    0.00,
    43291080.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000526'),
    '2024-12',
    5000.00,
    606500.00,
    0.00,
    2457660.91,
    0.00,
    3069160.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000527'),
    '2024-12',
    5000.00,
    38651521.00,
    3710000.00,
    1433550.24,
    0.00,
    43800071.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000531'),
    '2024-12',
    5000.00,
    135000.00,
    0.00,
    499532.50,
    0.00,
    639532.50
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000534'),
    '2024-12',
    5000.00,
    41603235.00,
    0.00,
    4340984.91,
    0.00,
    45949219.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000535'),
    '2024-12',
    5000.00,
    23075911.00,
    0.00,
    9179806.78,
    0.00,
    32260717.78
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000538'),
    '2024-12',
    5000.00,
    1095000.00,
    0.00,
    1960460.39,
    0.00,
    3060460.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000539'),
    '2024-12',
    5000.00,
    20413906.00,
    20000.00,
    701036.40,
    0.00,
    21139942.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000541'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    43412.42,
    0.00,
    43412.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000543'),
    '2024-12',
    0.00,
    -150000.00,
    0.00,
    -6154.51,
    0.00,
    -156154.51
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000545'),
    '2024-12',
    5000.00,
    39098998.00,
    890000.00,
    1337206.82,
    0.00,
    41331204.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000548'),
    '2024-12',
    0.00,
    3450000.00,
    0.00,
    -18.10,
    0.00,
    3449981.90
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000549'),
    '2024-12',
    0.00,
    0.00,
    -20000.00,
    -821.00,
    0.00,
    -20821.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000550'),
    '2024-12',
    5000.00,
    51809920.00,
    158000.00,
    10483962.02,
    0.00,
    62456882.02
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000552'),
    '2024-12',
    5000.00,
    73402694.00,
    698500.00,
    8258608.06,
    0.00,
    82364802.06
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000554'),
    '2024-12',
    5000.00,
    37869319.00,
    3500000.00,
    1826205.89,
    0.00,
    43200524.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000555'),
    '2024-12',
    5000.00,
    36992947.00,
    0.00,
    6366583.80,
    0.00,
    43364530.80
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000558'),
    '2024-12',
    5000.00,
    34672002.00,
    25000.00,
    4408086.03,
    0.00,
    39110088.03
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000560'),
    '2024-12',
    5000.00,
    21911919.00,
    0.00,
    2243490.50,
    0.00,
    24160409.50
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000562'),
    '2024-12',
    5000.00,
    74835223.00,
    250000.00,
    12763558.33,
    0.00,
    87853781.33
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000563'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    49200.96,
    0.00,
    49200.96
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000564'),
    '2024-12',
    5000.00,
    20005960.00,
    0.00,
    1899338.70,
    0.00,
    21910298.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000565'),
    '2024-12',
    5000.00,
    40463348.00,
    0.00,
    11107986.29,
    0.00,
    51576334.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000567'),
    '2024-12',
    5000.00,
    17777980.00,
    0.00,
    2388536.80,
    0.00,
    20171516.80
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000570'),
    '2024-12',
    5000.00,
    31888231.00,
    395000.00,
    4100405.48,
    0.00,
    36388636.48
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000571'),
    '2024-12',
    5000.00,
    1641653.00,
    0.00,
    1768476.71,
    0.00,
    3415129.71
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000573'),
    '2024-12',
    5000.00,
    25793093.00,
    855000.00,
    3262591.35,
    0.00,
    29915684.35
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000574'),
    '2024-12',
    5000.00,
    56734919.00,
    165000.00,
    14850975.93,
    0.00,
    71755894.93
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000575'),
    '2024-12',
    5000.00,
    21652747.00,
    0.00,
    2432512.62,
    0.00,
    24090259.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000579'),
    '2024-12',
    5000.00,
    58045785.00,
    160000.00,
    2375448.27,
    0.00,
    60586233.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000581'),
    '2024-12',
    5000.00,
    34570840.00,
    610000.00,
    6003615.84,
    0.00,
    41189455.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000584'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    412294.00,
    0.00,
    412294.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000585'),
    '2024-12',
    5000.00,
    25252117.00,
    50000.00,
    13048275.54,
    0.00,
    38355392.54
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000586'),
    '2024-12',
    5000.00,
    30987174.00,
    90000.00,
    935356.07,
    0.00,
    32017530.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000587'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    37264.42,
    0.00,
    37264.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000589'),
    '2024-12',
    0.00,
    500000.00,
    0.00,
    65055.47,
    0.00,
    565055.47
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000593'),
    '2024-12',
    5000.00,
    32914378.00,
    1670000.00,
    1141874.87,
    0.00,
    35731252.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000594'),
    '2024-12',
    5000.00,
    61400000.00,
    0.00,
    7272136.45,
    0.00,
    68677136.45
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000595'),
    '2024-12',
    5000.00,
    5835211.00,
    25000.00,
    1723221.62,
    0.00,
    7588432.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000596'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    214089.83,
    0.00,
    214089.83
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000597'),
    '2024-12',
    5000.00,
    32464901.00,
    1098000.00,
    4109784.95,
    0.00,
    37677685.95
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000598'),
    '2024-12',
    5000.00,
    38953217.00,
    40000.00,
    12257010.14,
    0.00,
    51255227.14
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000599'),
    '2024-12',
    5000.00,
    36880222.00,
    0.00,
    4846865.98,
    0.00,
    41732087.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000603'),
    '2024-12',
    5000.00,
    32270858.00,
    300000.00,
    2976770.72,
    0.00,
    35552628.72
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000604'),
    '2024-12',
    5000.00,
    395000.00,
    0.00,
    662041.09,
    0.00,
    1062041.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000624'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    52730.85,
    0.00,
    52730.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000630'),
    '2024-12',
    5000.00,
    3370000.00,
    0.00,
    -49690.17,
    0.00,
    3325309.83
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000632'),
    '2024-12',
    0.00,
    0.00,
    200000.00,
    43552.82,
    0.00,
    243552.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000636'),
    '2024-12',
    5000.00,
    19750000.00,
    0.00,
    2739502.46,
    0.00,
    22494502.46
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000638'),
    '2024-12',
    5000.00,
    17080000.00,
    350000.00,
    2595510.18,
    0.00,
    20030510.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000639'),
    '2024-12',
    5000.00,
    39380000.00,
    0.00,
    5364677.67,
    0.00,
    44749677.67
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000641'),
    '2024-12',
    5000.00,
    2390000.00,
    0.00,
    1477524.99,
    0.00,
    3872524.99
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000643'),
    '2024-12',
    5000.00,
    20250000.00,
    0.00,
    1753114.45,
    0.00,
    22008114.45
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000646'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    113023.38,
    0.00,
    113023.38
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000647'),
    '2024-12',
    0.00,
    500000.00,
    0.00,
    20515.00,
    0.00,
    520515.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000648'),
    '2024-12',
    0.00,
    8250000.00,
    250000.00,
    73733.34,
    0.00,
    8573733.34
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000650'),
    '2024-12',
    0.00,
    750000.00,
    0.00,
    30773.37,
    0.00,
    780773.37
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000651'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    10258.00,
    0.00,
    260258.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000652'),
    '2024-12',
    0.00,
    300000.00,
    0.00,
    96537.55,
    0.00,
    396537.55
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000655'),
    '2024-12',
    5000.00,
    11395000.00,
    0.00,
    2421595.96,
    0.00,
    13821595.96
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000656'),
    '2024-12',
    5000.00,
    30970000.00,
    1250000.00,
    2078763.60,
    0.00,
    34303763.60
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000658'),
    '2024-12',
    0.00,
    31975000.00,
    220000.00,
    2239487.16,
    0.00,
    34434487.16
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000660'),
    '2024-12',
    0.00,
    32150000.00,
    75000.00,
    2216413.72,
    0.00,
    34441413.72
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000661'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    751324.00,
    0.00,
    1001324.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000662'),
    '2024-12',
    5000.00,
    23495000.00,
    100000.00,
    723632.28,
    0.00,
    24323632.28
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000663'),
    '2024-12',
    5000.00,
    1970000.00,
    0.00,
    1237384.13,
    0.00,
    3212384.13
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000664'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    198289.00,
    0.00,
    198289.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000665'),
    '2024-12',
    5000.00,
    32095000.00,
    0.00,
    2978495.39,
    0.00,
    35078495.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000666'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    -697821.41,
    0.00,
    -697821.41
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000667'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    84388.35,
    0.00,
    84388.35
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000669'),
    '2024-12',
    5000.00,
    445000.00,
    0.00,
    395283.45,
    0.00,
    845283.45
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000671'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    50040.00,
    0.00,
    50040.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000672'),
    '2024-12',
    0.00,
    750000.00,
    0.00,
    30772.53,
    0.00,
    780772.53
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000676'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    728081.00,
    0.00,
    828081.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000679'),
    '2024-12',
    5000.00,
    49695000.00,
    0.00,
    4136374.56,
    0.00,
    53836374.56
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000680'),
    '2024-12',
    5000.00,
    18095000.00,
    0.00,
    2984869.09,
    0.00,
    21084869.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000681'),
    '2024-12',
    5000.00,
    17370000.00,
    0.00,
    3427958.47,
    0.00,
    20802958.47
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000683'),
    '2024-12',
    5000.00,
    31595000.00,
    100000.00,
    1941354.18,
    0.00,
    33641354.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000684'),
    '2024-12',
    5000.00,
    27070000.00,
    300000.00,
    1640962.98,
    0.00,
    29015962.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000685'),
    '2024-12',
    5000.00,
    18295000.00,
    0.00,
    3104661.87,
    0.00,
    21404661.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000686'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    398577.00,
    0.00,
    398577.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000689'),
    '2024-12',
    5000.00,
    17845000.00,
    500000.00,
    1735836.03,
    0.00,
    20085836.03
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000690'),
    '2024-12',
    5000.00,
    26820000.00,
    0.00,
    1836856.09,
    0.00,
    28661856.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000691'),
    '2024-12',
    5000.00,
    27970000.00,
    500000.00,
    1983926.41,
    0.00,
    30458926.41
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000692'),
    '2024-12',
    5000.00,
    19645000.00,
    0.00,
    3927782.85,
    0.00,
    23577782.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000693'),
    '2024-12',
    5000.00,
    31895000.00,
    300000.00,
    2087197.36,
    0.00,
    34287197.36
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000694'),
    '2024-12',
    5000.00,
    27995000.00,
    500000.00,
    2557449.89,
    0.00,
    31057449.89
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000695'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    70189.26,
    0.00,
    70189.26
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000696'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    163088.17,
    0.00,
    163088.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000699'),
    '2024-12',
    0.00,
    -750000.00,
    0.00,
    223068.71,
    0.00,
    -526931.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000700'),
    '2024-12',
    0.00,
    -1200000.00,
    0.00,
    20951.26,
    0.00,
    -1179048.74
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000701'),
    '2024-12',
    5000.00,
    19895000.00,
    0.00,
    3939100.57,
    0.00,
    23839100.57
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000702'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    111996.61,
    0.00,
    111996.61
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000703'),
    '2024-12',
    0.00,
    26375000.00,
    0.00,
    1705681.54,
    0.00,
    28080681.54
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000705'),
    '2024-12',
    5000.00,
    17695000.00,
    0.00,
    4032255.21,
    0.00,
    21732255.21
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000706'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    910266.00,
    0.00,
    910266.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000707'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    745169.00,
    0.00,
    845169.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000711'),
    '2024-12',
    5000.00,
    4495000.00,
    100000.00,
    836517.04,
    0.00,
    5436517.04
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000712'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    108834.98,
    0.00,
    108834.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000714'),
    '2024-12',
    5000.00,
    12995000.00,
    0.00,
    6535899.11,
    0.00,
    19535899.11
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000716'),
    '2024-12',
    5000.00,
    16095000.00,
    160000.00,
    1523804.43,
    0.00,
    17783804.43
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000727'),
    '2024-12',
    5000.00,
    50039480.00,
    1110000.00,
    1475239.85,
    0.00,
    52629719.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000728'),
    '2024-12',
    0.00,
    18975000.00,
    1470000.00,
    1221464.99,
    0.00,
    21666464.99
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000729'),
    '2024-12',
    5000.00,
    19120000.00,
    400000.00,
    1159991.83,
    0.00,
    20684991.83
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000730'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    742883.00,
    0.00,
    742883.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000731'),
    '2024-12',
    5000.00,
    445000.00,
    0.00,
    308415.67,
    0.00,
    758415.67
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000743'),
    '2024-12',
    5000.00,
    18775000.00,
    0.00,
    1521299.79,
    0.00,
    20301299.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000746'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    354015.87,
    0.00,
    354015.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000748'),
    '2024-12',
    5000.00,
    29545000.00,
    0.00,
    1429243.09,
    0.00,
    30979243.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000749'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    95613.24,
    0.00,
    95613.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000750'),
    '2024-12',
    0.00,
    29625000.00,
    0.00,
    1445932.00,
    0.00,
    31070932.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000751'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    90567.65,
    0.00,
    90567.65
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000752'),
    '2024-12',
    5000.00,
    29420000.00,
    0.00,
    1423920.52,
    0.00,
    30848920.52
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000753'),
    '2024-12',
    5000.00,
    13745000.00,
    0.00,
    945783.45,
    0.00,
    14695783.45
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000754'),
    '2024-12',
    5000.00,
    28995000.00,
    0.00,
    3361170.85,
    0.00,
    32361170.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000755'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    2923.00,
    0.00,
    2923.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000757'),
    '2024-12',
    5000.00,
    7495000.00,
    0.00,
    2459628.85,
    0.00,
    9959628.85
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000759'),
    '2024-12',
    5000.00,
    14270000.00,
    0.00,
    754350.24,
    0.00,
    15029350.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000760'),
    '2024-12',
    5000.00,
    24170000.00,
    0.00,
    2647979.21,
    0.00,
    26822979.21
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000761'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    474823.62,
    0.00,
    474823.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000763'),
    '2024-12',
    0.00,
    1500000.00,
    0.00,
    61546.00,
    0.00,
    1561546.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000764'),
    '2024-12',
    0.00,
    225000.00,
    0.00,
    485458.02,
    0.00,
    710458.02
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000765'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    967161.31,
    0.00,
    967161.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000766'),
    '2024-12',
    0.00,
    28000000.00,
    350000.00,
    1280476.24,
    0.00,
    29630476.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000767'),
    '2024-12',
    0.00,
    26775000.00,
    0.00,
    1456739.07,
    0.00,
    28231739.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000768'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    144090.19,
    0.00,
    144090.19
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000769'),
    '2024-12',
    5000.00,
    5995000.00,
    0.00,
    1754634.09,
    0.00,
    7754634.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000770'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    994670.00,
    0.00,
    994670.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000773'),
    '2024-12',
    0.00,
    3625000.00,
    0.00,
    1627635.74,
    0.00,
    5252635.74
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000774'),
    '2024-12',
    5000.00,
    29520000.00,
    1050000.00,
    1516239.29,
    0.00,
    32091239.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000775'),
    '2024-12',
    5000.00,
    18220000.00,
    200000.00,
    1708939.95,
    0.00,
    20133939.95
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000776'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    44519.61,
    0.00,
    44519.61
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000780'),
    '2024-12',
    5000.00,
    28995000.00,
    2350000.00,
    1378458.68,
    0.00,
    32728458.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000781'),
    '2024-12',
    10000.00,
    16307047.00,
    1345000.00,
    793220.06,
    0.00,
    18455267.06
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000788'),
    '2024-12',
    5000.00,
    2395000.00,
    0.00,
    1361198.37,
    0.00,
    3761198.37
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000789'),
    '2024-12',
    5000.00,
    24595000.00,
    0.00,
    1158578.59,
    0.00,
    25758578.59
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000791'),
    '2024-12',
    0.00,
    0.00,
    190000.00,
    590334.70,
    0.00,
    780334.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000792'),
    '2024-12',
    5000.00,
    11745000.00,
    0.00,
    1028485.06,
    0.00,
    12778485.06
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000793'),
    '2024-12',
    5000.00,
    11745000.00,
    540000.00,
    1096479.84,
    0.00,
    13386479.84
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000794'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    100204.44,
    0.00,
    100204.44
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000795'),
    '2024-12',
    5000.00,
    11745000.00,
    1440000.00,
    1126152.57,
    0.00,
    14316152.57
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000796'),
    '2024-12',
    5000.00,
    11745000.00,
    535000.00,
    1073380.23,
    0.00,
    13358380.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000797'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    96952.68,
    0.00,
    196952.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000798'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    36943.61,
    0.00,
    36943.61
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000799'),
    '2024-12',
    5000.00,
    18170000.00,
    300000.00,
    1393708.39,
    0.00,
    19868708.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000801'),
    '2024-12',
    5000.00,
    3295000.00,
    0.00,
    1675230.01,
    0.00,
    4975230.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000805'),
    '2024-12',
    5000.00,
    17445000.00,
    500000.00,
    1254818.05,
    0.00,
    19204818.05
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000807'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    916232.00,
    0.00,
    916232.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000809'),
    '2024-12',
    0.00,
    200000.00,
    0.00,
    33884.00,
    0.00,
    233884.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000815'),
    '2024-12',
    5000.00,
    11445000.00,
    260000.00,
    1265044.42,
    0.00,
    12975044.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000818'),
    '2024-12',
    5000.00,
    11825000.00,
    750000.00,
    1326642.87,
    0.00,
    13906642.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000819'),
    '2024-12',
    5000.00,
    11925000.00,
    0.00,
    1235456.17,
    0.00,
    13165456.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000820'),
    '2024-12',
    5000.00,
    11825000.00,
    675000.00,
    1259624.65,
    0.00,
    13764624.65
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000822'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    245018.00,
    0.00,
    245018.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000824'),
    '2024-12',
    0.00,
    500000.00,
    0.00,
    865938.87,
    0.00,
    1365938.87
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000829'),
    '2024-12',
    5000.00,
    100000.00,
    0.00,
    57346.82,
    0.00,
    162346.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000830'),
    '2024-12',
    5000.00,
    17470000.00,
    0.00,
    2771618.09,
    0.00,
    20246618.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000831'),
    '2024-12',
    5000.00,
    26545000.00,
    450000.00,
    1110078.24,
    0.00,
    28110078.24
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000832'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    62323.46,
    0.00,
    62323.46
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000833'),
    '2024-12',
    5000.00,
    17845000.00,
    850000.00,
    1530756.86,
    0.00,
    20230756.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000834'),
    '2024-12',
    5000.00,
    18220000.00,
    990000.00,
    1409310.49,
    0.00,
    20624310.49
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000835'),
    '2024-12',
    5000.00,
    23220000.00,
    100000.00,
    1464094.93,
    0.00,
    24789094.93
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000837'),
    '2024-12',
    5000.00,
    25845000.00,
    0.00,
    1485330.08,
    0.00,
    27335330.08
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000839'),
    '2024-12',
    5000.00,
    13795000.00,
    0.00,
    1112625.75,
    0.00,
    14912625.75
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000842'),
    '2024-12',
    5000.00,
    13795000.00,
    0.00,
    1112625.75,
    0.00,
    14912625.75
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000843'),
    '2024-12',
    5000.00,
    25595000.00,
    1800000.00,
    1030094.82,
    0.00,
    28430094.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000844'),
    '2024-12',
    0.00,
    13800000.00,
    0.00,
    1112625.75,
    0.00,
    14912625.75
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000845'),
    '2024-12',
    0.00,
    26450000.00,
    150000.00,
    3272585.09,
    0.00,
    29872585.09
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000846'),
    '2024-12',
    5000.00,
    2595000.00,
    0.00,
    861895.02,
    0.00,
    3461895.02
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000849'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    146700.01,
    0.00,
    146700.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000851'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    31160.01,
    0.00,
    31160.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000855'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    44689.96,
    0.00,
    194689.96
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000856'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    92320.00,
    0.00,
    92320.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000857'),
    '2024-12',
    5000.00,
    26295000.00,
    0.00,
    1191615.60,
    0.00,
    27491615.60
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000858'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    111632.76,
    0.00,
    111632.76
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000859'),
    '2024-12',
    5000.00,
    15145000.00,
    1050000.00,
    1300150.30,
    0.00,
    17500150.30
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000861'),
    '2024-12',
    5000.00,
    12995000.00,
    250000.00,
    1250900.63,
    0.00,
    14500900.63
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000862'),
    '2024-12',
    5000.00,
    11745000.00,
    0.00,
    1282181.46,
    0.00,
    13032181.46
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000863'),
    '2024-12',
    5000.00,
    15095000.00,
    0.00,
    949512.71,
    0.00,
    16049512.71
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000864'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    239963.32,
    0.00,
    239963.32
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000868'),
    '2024-12',
    0.00,
    9900000.00,
    280000.00,
    821124.72,
    0.00,
    11001124.72
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000869'),
    '2024-12',
    0.00,
    10775000.00,
    20000.00,
    1162941.15,
    0.00,
    11957941.15
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000870'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    56473.56,
    0.00,
    56473.56
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000871'),
    '2024-12',
    0.00,
    37100000.00,
    400000.00,
    1276388.27,
    0.00,
    38776388.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000872'),
    '2024-12',
    50000.00,
    15250000.00,
    1950000.00,
    1199789.98,
    0.00,
    18449789.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000873'),
    '2024-12',
    0.00,
    15975000.00,
    0.00,
    1229173.68,
    0.00,
    17204173.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000874'),
    '2024-12',
    200000.00,
    14350000.00,
    850000.00,
    1032467.91,
    0.00,
    16432467.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000876'),
    '2024-12',
    200000.00,
    9900000.00,
    0.00,
    994699.22,
    0.00,
    11094699.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000877'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    30305.00,
    0.00,
    30305.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000878'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    57100.68,
    0.00,
    157100.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000880'),
    '2024-12',
    200000.00,
    9900000.00,
    0.00,
    994699.22,
    0.00,
    11094699.22
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000881'),
    '2024-12',
    200000.00,
    14150000.00,
    500000.00,
    974401.25,
    0.00,
    15824401.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000882'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    268887.00,
    0.00,
    268887.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000883'),
    '2024-12',
    200000.00,
    2500000.00,
    0.00,
    442464.00,
    0.00,
    3142464.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000884'),
    '2024-12',
    200000.00,
    6500000.00,
    600000.00,
    738351.31,
    0.00,
    8038351.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000887'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    73086.15,
    0.00,
    73086.15
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000888'),
    '2024-12',
    200000.00,
    1700000.00,
    150000.00,
    393966.00,
    0.00,
    2443966.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000889'),
    '2024-12',
    200000.00,
    9100000.00,
    150000.00,
    1033399.57,
    0.00,
    10483399.57
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000891'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    30305.00,
    0.00,
    30305.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000894'),
    '2024-12',
    200000.00,
    10100000.00,
    0.00,
    1014269.28,
    0.00,
    11314269.28
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000895'),
    '2024-12',
    200000.00,
    4900000.00,
    0.00,
    781057.31,
    0.00,
    5881057.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000896'),
    '2024-12',
    200000.00,
    15150000.00,
    0.00,
    912310.31,
    0.00,
    16262310.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000897'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    336490.00,
    0.00,
    436490.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000898'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    268887.00,
    0.00,
    268887.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000899'),
    '2024-12',
    0.00,
    -100000.00,
    0.00,
    -4103.00,
    0.00,
    -104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000900'),
    '2024-12',
    0.00,
    0.00,
    -250000.00,
    -10258.00,
    0.00,
    -260258.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000903'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    353848.00,
    0.00,
    353848.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000904'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    10257.69,
    0.00,
    260257.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000905'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    34196.20,
    0.00,
    34196.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000906'),
    '2024-12',
    200000.00,
    22200000.00,
    0.00,
    1813074.97,
    0.00,
    24213074.97
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000907'),
    '2024-12',
    0.00,
    200000.00,
    0.00,
    198184.25,
    0.00,
    398184.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000908'),
    '2024-12',
    200000.00,
    8450000.00,
    0.00,
    697057.16,
    0.00,
    9347057.16
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000909'),
    '2024-12',
    200000.00,
    15350000.00,
    0.00,
    875288.20,
    0.00,
    16425288.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000910'),
    '2024-12',
    200000.00,
    14700000.00,
    0.00,
    923533.05,
    0.00,
    15823533.05
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000911'),
    '2024-12',
    200000.00,
    19700000.00,
    0.00,
    1227096.90,
    0.00,
    21127096.90
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000912'),
    '2024-12',
    200000.00,
    22350000.00,
    0.00,
    1151567.29,
    0.00,
    23701567.29
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000913'),
    '2024-12',
    200000.00,
    12850000.00,
    0.00,
    662189.44,
    0.00,
    13712189.44
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000914'),
    '2024-12',
    0.00,
    0.00,
    2187500.00,
    89754.59,
    0.00,
    2277254.59
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000915'),
    '2024-12',
    200000.00,
    22350000.00,
    0.00,
    1167805.63,
    0.00,
    23717805.63
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000916'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    257804.55,
    0.00,
    257804.55
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000920'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    27259.63,
    0.00,
    27259.63
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000921'),
    '2024-12',
    200000.00,
    22350000.00,
    250000.00,
    1179558.27,
    0.00,
    23979558.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000922'),
    '2024-12',
    200000.00,
    2250000.00,
    60000.00,
    616204.67,
    0.00,
    3126204.67
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000923'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    437817.68,
    0.00,
    437817.68
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000924'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    31707.00,
    0.00,
    31707.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000925'),
    '2024-12',
    0.00,
    -100000.00,
    0.00,
    18230.00,
    0.00,
    -81770.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000926'),
    '2024-12',
    150000.00,
    9950000.00,
    0.00,
    981399.27,
    0.00,
    11081399.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000927'),
    '2024-12',
    150000.00,
    9950000.00,
    150000.00,
    1004712.98,
    0.00,
    11254712.98
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000928'),
    '2024-12',
    150000.00,
    9950000.00,
    0.00,
    700085.08,
    0.00,
    10800085.08
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000929'),
    '2024-12',
    150000.00,
    9950000.00,
    450000.00,
    999446.05,
    0.00,
    11549446.05
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000930'),
    '2024-12',
    200000.00,
    14250000.00,
    0.00,
    1561645.62,
    0.00,
    16011645.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000931'),
    '2024-12',
    0.00,
    300000.00,
    0.00,
    45285.59,
    0.00,
    345285.59
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000933'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    36113.00,
    0.00,
    36113.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000934'),
    '2024-12',
    200000.00,
    22350000.00,
    0.00,
    1167805.63,
    0.00,
    23717805.63
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000935'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    85439.20,
    0.00,
    335439.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000937'),
    '2024-12',
    150000.00,
    10050000.00,
    0.00,
    984609.61,
    0.00,
    11184609.61
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000938'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    34196.20,
    0.00,
    34196.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000939'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    50275.42,
    0.00,
    50275.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000940'),
    '2024-12',
    200000.00,
    9900000.00,
    0.00,
    975662.15,
    0.00,
    11075662.15
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000944'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    30328.00,
    0.00,
    30328.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000945'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    21717.49,
    0.00,
    21717.49
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000946'),
    '2024-12',
    200000.00,
    2400000.00,
    0.00,
    392833.18,
    0.00,
    2992833.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000948'),
    '2024-12',
    200000.00,
    9600000.00,
    750000.00,
    961088.51,
    0.00,
    11511088.51
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000949'),
    '2024-12',
    200000.00,
    9800000.00,
    150000.00,
    967539.18,
    0.00,
    11117539.18
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000950'),
    '2024-12',
    0.00,
    8550000.00,
    0.00,
    618493.17,
    0.00,
    9168493.17
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000951'),
    '2024-12',
    200000.00,
    22100000.00,
    0.00,
    1133150.12,
    0.00,
    23433150.12
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000952'),
    '2024-12',
    0.00,
    22350000.00,
    0.00,
    1123182.69,
    0.00,
    23473182.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000953'),
    '2024-12',
    0.00,
    22450000.00,
    0.00,
    1132948.19,
    0.00,
    23582948.19
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000954'),
    '2024-12',
    0.00,
    22100000.00,
    250000.00,
    1137647.04,
    0.00,
    23487647.04
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000957'),
    '2024-12',
    0.00,
    250000.00,
    0.00,
    80222.31,
    0.00,
    330222.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000959'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    32558.31,
    0.00,
    32558.31
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000964'),
    '2024-12',
    0.00,
    0.00,
    -100000.00,
    -4103.00,
    0.00,
    -104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000965'),
    '2024-12',
    50000.00,
    0.00,
    0.00,
    2052.00,
    0.00,
    52052.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000966'),
    '2024-12',
    0.00,
    -100000.00,
    0.00,
    -4103.00,
    0.00,
    -104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000967'),
    '2024-12',
    0.00,
    2150000.00,
    0.00,
    321584.32,
    0.00,
    2471584.32
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000968'),
    '2024-12',
    200000.00,
    400000.00,
    0.00,
    137069.94,
    0.00,
    737069.94
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000969'),
    '2024-12',
    200000.00,
    9800000.00,
    1870000.00,
    1084033.54,
    0.00,
    12954033.54
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000970'),
    '2024-12',
    200000.00,
    9700000.00,
    550000.00,
    971019.91,
    0.00,
    11421019.91
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000971'),
    '2024-12',
    0.00,
    22350000.00,
    0.00,
    1123182.69,
    0.00,
    23473182.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000972'),
    '2024-12',
    0.00,
    14250000.00,
    0.00,
    1722407.33,
    0.00,
    15972407.33
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000973'),
    '2024-12',
    0.00,
    14400000.00,
    0.00,
    1141281.79,
    0.00,
    15541281.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000975'),
    '2024-12',
    0.00,
    3025000.00,
    0.00,
    821234.82,
    0.00,
    3846234.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000976'),
    '2024-12',
    0.00,
    450000.00,
    0.00,
    155854.37,
    0.00,
    605854.37
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000977'),
    '2024-12',
    0.00,
    450000.00,
    0.00,
    162284.16,
    0.00,
    612284.16
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000978'),
    '2024-12',
    0.00,
    450000.00,
    0.00,
    162284.16,
    0.00,
    612284.16
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000979'),
    '2024-12',
    0.00,
    14250000.00,
    0.00,
    852062.70,
    0.00,
    15102062.70
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000981'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    1188807.39,
    0.00,
    14688807.39
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000982'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    1188808.40,
    0.00,
    14688808.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000983'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    1188808.40,
    0.00,
    14688808.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000984'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    1188808.40,
    0.00,
    14688808.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000986'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    351200.95,
    0.00,
    13851200.95
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000987'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    1188808.40,
    0.00,
    14688808.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000988'),
    '2024-12',
    0.00,
    13500000.00,
    0.00,
    1188808.40,
    0.00,
    14688808.40
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000989'),
    '2024-12',
    0.00,
    10700000.00,
    185000.00,
    628946.30,
    0.00,
    11513946.30
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000990'),
    '2024-12',
    200000.00,
    18500000.00,
    350000.00,
    1264127.86,
    0.00,
    20314127.86
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000991'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    235319.56,
    0.00,
    235319.56
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000992'),
    '2024-12',
    0.00,
    1300000.00,
    0.00,
    318679.00,
    0.00,
    1618679.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000993'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    34776.25,
    0.00,
    34776.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000994'),
    '2024-12',
    200000.00,
    9050000.00,
    250000.00,
    752771.43,
    0.00,
    10252771.43
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000995'),
    '2024-12',
    0.00,
    200000.00,
    0.00,
    23745.63,
    0.00,
    223745.63
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000996'),
    '2024-12',
    0.00,
    -100000.00,
    0.00,
    -4103.00,
    0.00,
    -104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000997'),
    '2024-12',
    0.00,
    -100000.00,
    0.00,
    -4103.00,
    0.00,
    -104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '000998'),
    '2024-12',
    0.00,
    -100000.00,
    0.00,
    -4103.00,
    0.00,
    -104103.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001000'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    32185.81,
    0.00,
    32185.81
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001001'),
    '2024-12',
    0.00,
    22400000.00,
    0.00,
    1764603.69,
    0.00,
    24164603.69
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001003'),
    '2024-12',
    200000.00,
    8800000.00,
    870000.00,
    770674.79,
    0.00,
    10640674.79
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001004'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    86818.00,
    0.00,
    86818.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001006'),
    '2024-12',
    0.00,
    21200000.00,
    0.00,
    1305390.66,
    0.00,
    22505390.66
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001008'),
    '2024-12',
    0.00,
    8100000.00,
    100000.00,
    586660.42,
    0.00,
    8786660.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001009'),
    '2024-12',
    200000.00,
    11850000.00,
    800000.00,
    1010371.25,
    0.00,
    13860371.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001010'),
    '2024-12',
    200000.00,
    11700000.00,
    500000.00,
    903027.27,
    0.00,
    13303027.27
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001011'),
    '2024-12',
    200000.00,
    11400000.00,
    250000.00,
    820379.50,
    0.00,
    12670379.50
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001012'),
    '2024-12',
    0.00,
    10800000.00,
    0.00,
    674402.64,
    0.00,
    11474402.64
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001013'),
    '2024-12',
    0.00,
    10800000.00,
    0.00,
    674402.64,
    0.00,
    11474402.64
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001014'),
    '2024-12',
    200000.00,
    7100000.00,
    600000.00,
    515978.07,
    0.00,
    8415978.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001016'),
    '2024-12',
    0.00,
    11100000.00,
    0.00,
    679337.88,
    0.00,
    11779337.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001017'),
    '2024-12',
    0.00,
    11100000.00,
    0.00,
    679337.88,
    0.00,
    11779337.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001018'),
    '2024-12',
    0.00,
    11100000.00,
    0.00,
    667101.35,
    0.00,
    11767101.35
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001019'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    10343.25,
    0.00,
    110343.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001021'),
    '2024-12',
    200000.00,
    7100000.00,
    1250000.00,
    486745.71,
    0.00,
    9036745.71
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001022'),
    '2024-12',
    0.00,
    100000.00,
    0.00,
    72873.00,
    0.00,
    172873.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001023'),
    '2024-12',
    0.00,
    4900000.00,
    0.00,
    316375.82,
    0.00,
    5216375.82
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001024'),
    '2024-12',
    0.00,
    6600000.00,
    0.00,
    323078.83,
    0.00,
    6923078.83
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001026'),
    '2024-12',
    0.00,
    9300000.00,
    750000.00,
    404293.97,
    0.00,
    10454293.97
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001028'),
    '2024-12',
    0.00,
    6000000.00,
    500000.00,
    237229.42,
    0.00,
    6737229.42
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001029'),
    '2024-12',
    0.00,
    6000000.00,
    0.00,
    218980.54,
    0.00,
    6218980.54
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001031'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001032'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001033'),
    '2024-12',
    0.00,
    9300000.00,
    750000.00,
    386475.08,
    0.00,
    10436475.08
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001034'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001036'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    43822.00,
    0.00,
    43822.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001038'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001039'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001040'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001041'),
    '2024-12',
    0.00,
    0.00,
    0.00,
    86904.00,
    0.00,
    86904.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001042'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001043'),
    '2024-12',
    0.00,
    9300000.00,
    500000.00,
    381801.25,
    0.00,
    10181801.25
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001044'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001045'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001046'),
    '2024-12',
    0.00,
    9300000.00,
    0.00,
    375098.23,
    0.00,
    9675098.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001047'),
    '2024-12',
    0.00,
    9300000.00,
    500000.00,
    378449.74,
    0.00,
    10178449.74
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001048'),
    '2024-12',
    200000.00,
    5700000.00,
    400000.00,
    225023.21,
    0.00,
    6525023.21
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001050'),
    '2024-12',
    200000.00,
    2600000.00,
    225000.00,
    163525.01,
    0.00,
    3188525.01
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001058'),
    '2024-12',
    200000.00,
    5500000.00,
    270000.00,
    174946.72,
    0.00,
    6144946.72
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001059'),
    '2024-12',
    0.00,
    13250000.00,
    0.00,
    479977.23,
    0.00,
    13729977.23
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001060'),
    '2024-12',
    0.00,
    4700000.00,
    350000.00,
    114371.44,
    0.00,
    5164371.44
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001061'),
    '2024-12',
    0.00,
    150000.00,
    0.00,
    0.00,
    0.00,
    150000.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001062'),
    '2024-12',
    0.00,
    6750000.00,
    0.00,
    145376.15,
    0.00,
    6895376.15
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001063'),
    '2024-12',
    400000.00,
    11500000.00,
    0.00,
    272848.77,
    0.00,
    12172848.77
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001064'),
    '2024-12',
    200000.00,
    4300000.00,
    100000.00,
    98408.49,
    0.00,
    4698408.49
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001065'),
    '2024-12',
    200000.00,
    4300000.00,
    300000.00,
    102959.43,
    0.00,
    4902959.43
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001066'),
    '2024-12',
    200000.00,
    3100000.00,
    500000.00,
    111655.07,
    0.00,
    3911655.07
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001069'),
    '2024-12',
    0.00,
    4200000.00,
    0.00,
    82815.61,
    0,
    4282815.61
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001070'),
    '2024-12',
    0.00,
    20500000.00,
    0.00,
    414072.99,
    0,
    20914072.99
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001072'),
    '2024-12',
    0.00,
    8750000.00,
    0.00,
    60997.00,
    0,
    8810997.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001073'),
    '2024-12',
    0.00,
    8550000.00,
    0.00,
    58316.00,
    0,
    8608316.00
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001074'),
    '2024-12',
    0.00,
    11500000.00,
    0.00,
    80436.20,
    0,
    11580436.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001075'),
    '2024-12',
    0.00,
    11500000.00,
    0.00,
    80436.20,
    0,
    11580436.20
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001081'),
    '2024-12',
    0.00,
    6300000.00,
    0.00,
    28152.67,
    0.00,
    6328152.67
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001082'),
    '2024-12',
    0.00,
    6200000.00,
    450000.00,
    30833.88,
    0,
    6680833.88
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001083'),
    '2024-12',
    0.00,
    2550000.00,
    0.00,
    10054.53,
    0,
    2560054.53
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001084'),
    '2024-12',
    0.00,
    7500000.00,
    0.00,
    20109.05,
    0,
    7520109.05
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001085'),
    '2024-12',
    200000.00,
    1300000.00,
    100000.00,
    5362.41,
    0,
    1605362.41
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001086'),
    '2024-12',
    200000.00,
    1300000.00,
    300000.00,
    8043.62,
    0,
    1808043.62
  ),
  (
    (SELECT id FROM users WHERE employee_id = '001087'),
    '2024-12',
    200000.00,
    1200000.00,
    0.00,
    4021.81,
    0,
    1404021.81
  )
ON CONFLICT DO NOTHING;

COMMIT;
