-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 11, 2026 at 12:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `unihall`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `userId` char(36) NOT NULL,
  `designation` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `hallId` char(36) DEFAULT NULL,
  `officeLocation` varchar(255) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_profiles`
--

INSERT INTO `admin_profiles` (`userId`, `designation`, `department`, `hallId`, `officeLocation`, `phone`, `photoUrl`, `created_at`, `updated_at`, `created_by`) VALUES
('admin-ash', 'Hall Provost', 'Student Affairs', 'hall-ash', 'Provost Office, Ground Floor, ASH', '+8801800000000', NULL, '2025-10-28 20:53:36', NULL, 'admin-ash'),
('admin-muh', 'Assistant Provost', 'Student Welfare', 'hall-muh', 'Admin Block, Level 2, MUH', '+8801700000000', NULL, '2025-10-28 20:53:36', NULL, 'admin-muh');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `applicationId` char(36) NOT NULL,
  `studentId` char(36) NOT NULL,
  `hallId` char(36) NOT NULL,
  `formId` char(36) NOT NULL,
  `formVersionId` char(36) NOT NULL,
  `status` enum('submitted','scheduled','rejected','alloted','not-alloted') NOT NULL DEFAULT 'submitted',
  `submissionDate` datetime DEFAULT NULL,
  `reviewedBy` char(36) DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `totalScore` decimal(5,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`applicationId`, `studentId`, `hallId`, `formId`, `formVersionId`, `status`, `submissionDate`, `reviewedBy`, `reviewedAt`, `totalScore`, `created_at`, `updated_at`) VALUES
('0665945f-dcac-4e3a-a4dd-deeda4ea37ae', '1454f781-e5f6-49e1-8ed7-f32599263e71', 'hall-muh', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '574136f9-ff1f-4409-a07b-5440877a3c41', 'alloted', '2026-01-11 03:26:34', NULL, NULL, 0.00, '2026-01-11 03:26:34', '2026-01-11 03:26:34'),
('359d48b5-6f06-416e-8352-6dee6bd9f0bf', 'MUH2225026M', 'hall-muh', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '574136f9-ff1f-4409-a07b-5440877a3c41', 'alloted', '2026-01-11 01:22:00', NULL, NULL, 5.00, '2026-01-11 01:22:00', '2026-01-11 01:26:35'),
('3e720e16-d8e5-4ac0-81e3-f44208dad6af', 'MUH2125020M', 'hall-muh', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '00e6113a-1711-4097-a3d6-0f20cf3a3c15', 'alloted', '2025-12-26 01:37:50', NULL, NULL, 15.00, '2025-12-26 01:37:50', '2025-12-26 01:40:17'),
('65650e77-ed20-4f84-84df-25be2d585432', 'student-muh', 'hall-muh', 'cde55119-f3c1-4967-b561-18b5b41a6dfb', 'c9f22ad6-6068-41e3-8802-49df523c988f', 'submitted', '2025-12-14 19:00:58', NULL, NULL, 0.00, '2025-12-14 19:00:58', '2025-12-14 19:00:58'),
('88844505-03ef-4f9a-add8-c4584eb5eaf8', 'MUH2125013M', 'hall-muh', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '00e6113a-1711-4097-a3d6-0f20cf3a3c15', 'alloted', '2025-12-26 00:46:01', NULL, NULL, 15.00, '2025-12-26 00:46:01', '2025-12-26 00:54:05'),
('8b4a5628-caef-4d29-92a3-ac3234333974', 'MUH2125020M', 'hall-muh', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '574136f9-ff1f-4409-a07b-5440877a3c41', 'alloted', '2025-12-26 02:09:36', NULL, NULL, 5.00, '2025-12-26 02:09:36', '2025-12-26 02:11:08'),
('991329f5-552e-4f8d-a0e9-6cd6913f12e8', 'MUH2225030M', 'hall-muh', 'cde55119-f3c1-4967-b561-18b5b41a6dfb', 'c9f22ad6-6068-41e3-8802-49df523c988f', 'alloted', '2025-12-25 22:05:39', NULL, NULL, 0.00, '2025-12-25 22:05:39', '2025-12-25 22:11:54'),
('a7ec2b54-8c3c-4e34-b284-c5519b663cef', 'MUH2225013M', 'hall-muh', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'scheduled', '2025-12-25 03:29:51', NULL, NULL, 0.00, '2025-12-25 03:29:51', '2025-12-25 04:58:42'),
('bb76ce59-1b85-43e8-972e-b1c9aad0e617', 'MUH2225001M', 'hall-muh', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'alloted', '2025-12-15 12:33:47', NULL, NULL, 25.00, '2025-12-15 12:33:47', '2025-12-25 05:00:21'),
('e59d076e-3e13-4b04-91de-1687a066b62a', 'MUH2233020M', 'hall-muh', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '574136f9-ff1f-4409-a07b-5440877a3c41', 'alloted', '2025-12-26 15:22:21', NULL, NULL, 5.00, '2025-12-26 15:22:21', '2025-12-26 15:24:49'),
('ec2fe4c9-04ec-4140-8648-82a5863e26be', 'ASH2225033M', 'hall-ash', '93690181-2489-4559-8b87-456ce15599fa', 'dda27cf3-2af8-485a-9ffa-2a10d43befba', 'alloted', '2026-01-09 12:59:53', NULL, NULL, 0.00, '2026-01-09 12:59:53', '2026-01-09 13:08:36'),
('ec42fd37-691c-49ab-be90-fad5207d71c9', 'student-muh', 'hall-muh', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'scheduled', '2025-11-10 00:11:24', NULL, NULL, 10.00, '2025-11-10 00:11:24', '2025-12-25 04:58:42');

-- --------------------------------------------------------

--
-- Table structure for table `application_forms`
--

CREATE TABLE `application_forms` (
  `formId` char(36) NOT NULL,
  `hallId` char(36) NOT NULL,
  `formTitle` varchar(255) NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `isActive` tinyint(1) NOT NULL DEFAULT 0,
  `applicationDeadline` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `application_forms`
--

INSERT INTO `application_forms` (`formId`, `hallId`, `formTitle`, `version`, `isActive`, `applicationDeadline`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
('2248c16a-44ff-4da8-a1f5-d7e72468bd87', 'hall-muh', 'Test-21', 1, 1, NULL, '2025-12-26 02:08:42', '2025-12-26 02:08:47', 'admin-muh', 'admin-muh'),
('8f24f0eb-d449-4786-b284-0138ef8a2f8b', 'hall-muh', 'Test-20', 1, 0, NULL, '2025-12-26 00:44:08', '2025-12-26 02:08:47', 'admin-muh', NULL),
('93690181-2489-4559-8b87-456ce15599fa', 'hall-ash', 'Test1', 1, 1, NULL, '2025-12-14 18:53:29', '2025-12-14 18:53:40', 'admin-ash', 'admin-ash'),
('c6dcb669-d39d-4ed1-ba35-5bcf86662b44', 'hall-muh', 'Test-20', 1, 0, NULL, '2025-12-26 00:45:11', '2025-12-26 02:08:47', 'admin-muh', 'admin-muh'),
('cde55119-f3c1-4967-b561-18b5b41a6dfb', 'hall-muh', 'New', 1, 0, NULL, '2025-11-05 15:48:25', '2025-12-26 02:08:47', 'admin-muh', 'admin-muh'),
('e6890c27-f3b5-41e0-958c-dc1c21649c29', 'hall-muh', 'Admission-25', 1, 0, NULL, '2025-11-04 14:29:49', '2025-12-26 02:08:47', 'admin-muh', 'admin-muh'),
('fffb6708-20fe-44d4-b428-3d885c20d6cd', 'hall-ash', 'Salam Hall', 1, 0, NULL, '2025-11-09 22:57:49', '2025-12-14 18:53:40', 'admin-ash', 'admin-ash');

-- --------------------------------------------------------

--
-- Table structure for table `attachments`
--

CREATE TABLE `attachments` (
  `attachmentId` char(36) NOT NULL,
  `entityType` enum('APPLICATION','RENEWAL','COMPLAINT','PAYMENT','EXAM_RESULT','SEAT_PLAN','PROFILE_PHOTO','FORM_RESPONSE','OTHER') NOT NULL,
  `entityId` char(36) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileType` varchar(50) NOT NULL,
  `fileUrl` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attachments`
--

INSERT INTO `attachments` (`attachmentId`, `entityType`, `entityId`, `fileName`, `fileType`, `fileUrl`, `created_at`, `created_by`) VALUES
('21d6d99e-6aa8-4b82-af72-814d7a41b0a3', 'FORM_RESPONSE', '9973f521-7001-4bcf-ac4a-712da8d13c11', 'IMG20251202105222.jpg', 'image/jpeg', '/uploads/pending/IMG20251202105222.jpg', '2025-12-15 12:33:47', 'MUH2225001M'),
('40897bae-e6de-4c05-a702-4bfa64b1af6e', 'SEAT_PLAN', 'pending', 'full_solutions.pdf', 'application/pdf', '/uploads/seat-plans/29be1c46-e9df-444b-9c89-33e6b268a32f.pdf', '2026-01-10 01:42:04', 'exam-controller-main'),
('46087cd1-f616-435e-9c95-562aa7520bb7', 'FORM_RESPONSE', '9973f521-7001-4bcf-ac4a-712da8d13c11', 'command.txt', 'text/plain', '/uploads/pending/command.txt', '2025-12-15 12:33:47', 'MUH2225001M'),
('579fadce-02f5-455a-b186-78e41a4bfc3c', 'EXAM_RESULT', 'pending', 'solutions.pdf', 'application/pdf', '/uploads/exam-results/b8aecc3f-849f-461c-b2ba-37958329a913.pdf', '2026-01-10 01:40:59', 'exam-controller-main'),
('7576a600-bd6f-493f-856e-250aba2ac189', 'SEAT_PLAN', 'pending', 'solutions.pdf', 'application/pdf', '/uploads/seat-plans/cd1d30c9-03c4-4122-b820-b01fe0f0909d.pdf', '2026-01-10 01:40:28', 'exam-controller-main'),
('9720b0fe-176c-432a-98d4-98600fe69bda', 'FORM_RESPONSE', '919917dc-fdbf-4753-ba81-14fdf53fb3bd', 'graphviz (2).png', 'image/png', '/uploads/pending/graphviz%20(2).png', '2025-11-10 00:11:24', 'student-muh'),
('dc914c70-ab1c-4e69-a49e-27bbf0c82285', 'COMPLAINT', '146b456e-ecf1-424e-88b5-227ff327ec61', '346797714_546221630921420_2385853661271246554_n.jpg', 'image/jpeg', '/uploads/pending/346797714_546221630921420_2385853661271246554_n.jpg', '2026-01-09 13:12:58', 'ASH2225033M');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `complaintId` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `hallId` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('MAINTENANCE','ELECTRICAL','PLUMBING','CLEANING','SECURITY','DISCIPLINARY','FOOD','OTHER') NOT NULL,
  `priority` varchar(20) NOT NULL DEFAULT 'MEDIUM',
  `status` enum('SUBMITTED','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  `resolutionDetails` text DEFAULT NULL,
  `attachmentId` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `resolved_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `complaints`
--

INSERT INTO `complaints` (`complaintId`, `userId`, `hallId`, `title`, `description`, `category`, `priority`, `status`, `resolutionDetails`, `attachmentId`, `created_at`, `updated_at`, `resolved_at`, `created_by`, `updated_by`) VALUES
('146b456e-ecf1-424e-88b5-227ff327ec61', 'ASH2225033M', 'hall-ash', 'light issue', 'room er light noshto', 'OTHER', 'MEDIUM', 'RESOLVED', NULL, 'dc914c70-ab1c-4e69-a49e-27bbf0c82285', '2026-01-09 13:12:58', '2026-01-09 20:13:29', '2026-01-09 20:13:29', 'ASH2225033M', 'admin-ash'),
('969f429b-36c4-4742-87e4-3c91b86b4dd2', 'MUH2233020M', 'hall-muh', 'water issue', 'abc', 'OTHER', 'MEDIUM', 'IN_PROGRESS', NULL, NULL, '2025-12-26 15:33:25', '2026-01-10 20:23:29', NULL, 'MUH2233020M', 'admin-muh'),
('a2d20f29-7139-4c49-ad47-6490555a5345', 'ASH2225033M', NULL, 'Noisy Neighbours', 'They staring singing bawali song in big tone', 'OTHER', 'MEDIUM', 'SUBMITTED', NULL, NULL, '2026-01-07 13:46:57', '2026-01-07 13:46:57', NULL, 'ASH2225033M', NULL),
('bf2b1799-15b0-420d-b45d-ef7466a75a74', 'MUH2225030M', 'hall-muh', 'Electicity issue', 'abc', 'OTHER', 'MEDIUM', 'SUBMITTED', NULL, NULL, '2025-12-26 03:50:09', '2025-12-26 03:50:09', NULL, 'MUH2225030M', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `disciplinary_records`
--

CREATE TABLE `disciplinary_records` (
  `recordId` char(36) NOT NULL,
  `studentId` char(36) NOT NULL,
  `hallId` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `details` text NOT NULL,
  `severity` varchar(20) NOT NULL,
  `actionTaken` text DEFAULT NULL,
  `incidentDate` date NOT NULL,
  `status` enum('ACTIVE','INACTIVE','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `attachmentId` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `disciplinary_records`
--

INSERT INTO `disciplinary_records` (`recordId`, `studentId`, `hallId`, `title`, `details`, `severity`, `actionTaken`, `incidentDate`, `status`, `attachmentId`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
('30885531-004a-403a-9a79-4001758fe14e', 'ASH2225026M', 'hall-ash', 'Attacking roommate', 'Attacked his roommate shakib', 'Severe', 'No', '2026-01-05', 'ACTIVE', NULL, '2026-01-06 16:50:10', '2026-01-06 16:53:36', 'admin-ash', 'admin-ash'),
('44b2c6bf-8863-4c57-8c60-e9403cbd8f8f', 'student-muh', 'hall-muh', 'Violation', 'Attacked his roommate', 'Severe', 'NO', '2026-01-07', 'ACTIVE', NULL, '2026-01-07 14:44:03', NULL, 'admin-muh', NULL),
('a2aab013-0436-424a-bac5-e74ee435f57f', 'MUH2225001M', 'hall-muh', 'Noise violation', 'Gaan bajna', 'Minor', 'NO', '2026-01-09', 'ACTIVE', NULL, '2026-01-09 13:20:08', NULL, 'admin-muh', NULL),
('f1cf6086-fed7-4dc9-b51e-08e2b1e0b8aa', 'MUH2125013M', 'hall-muh', 'Violation', 'xys', 'Minor', 'NO', '2026-01-07', 'ACTIVE', NULL, '2026-01-07 14:38:30', NULL, 'admin-muh', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `exam_controller_profiles`
--

CREATE TABLE `exam_controller_profiles` (
  `userId` char(36) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `officeLocation` varchar(255) DEFAULT NULL,
  `contactExt` varchar(20) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exam_controller_profiles`
--

INSERT INTO `exam_controller_profiles` (`userId`, `designation`, `department`, `officeLocation`, `contactExt`, `phone`, `photoUrl`, `created_at`, `updated_at`) VALUES
('exam-controller-main', 'Exam Controller', 'Academics', 'Examination Office', NULL, '+8801700000010', NULL, '2026-01-10 01:27:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `exam_results`
--

CREATE TABLE `exam_results` (
  `resultId` char(36) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `academicYear` varchar(10) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT 0,
  `attachmentId` char(36) NOT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `created_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exam_results`
--

INSERT INTO `exam_results` (`resultId`, `semester`, `academicYear`, `department`, `title`, `description`, `isVisible`, `attachmentId`, `publishedAt`, `created_at`, `updated_at`, `created_by`) VALUES
('e2cb8e85-63da-4ad3-aa8e-58b333133f83', '3-1', '2021-2022', 'IIT', 'iit result out', '', 1, '579fadce-02f5-455a-b186-78e41a4bfc3c', '2026-01-10 01:40:59', '2026-01-10 01:40:59', NULL, 'exam-controller-main');

-- --------------------------------------------------------

--
-- Table structure for table `exam_seat_plans`
--

CREATE TABLE `exam_seat_plans` (
  `planId` char(36) NOT NULL,
  `examName` varchar(255) NOT NULL,
  `examDate` date NOT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `academicYear` varchar(10) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT 0,
  `attachmentId` char(36) NOT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exam_seat_plans`
--

INSERT INTO `exam_seat_plans` (`planId`, `examName`, `examDate`, `semester`, `academicYear`, `department`, `description`, `isVisible`, `attachmentId`, `publishedAt`, `created_at`, `created_by`) VALUES
('6a8df712-dd68-4d61-886c-563daaacb4f5', 'swes seat', '2026-01-20', '2-1', '2021-2022', 'SWES', '', 1, '40897bae-e6de-4c05-a702-4bfa64b1af6e', '2026-01-10 01:42:04', '2026-01-10 01:42:04', 'exam-controller-main'),
('caa67559-f682-44f3-af9b-953c5c5576af', 'dddd', '2026-01-13', '2-2', '2022-2023', 'SWES', '', 1, '7576a600-bd6f-493f-856e-250aba2ac189', '2026-01-10 01:40:28', '2026-01-10 01:40:28', 'exam-controller-main');

-- --------------------------------------------------------

--
-- Table structure for table `field_options`
--

CREATE TABLE `field_options` (
  `optionId` char(36) NOT NULL,
  `fieldId` char(36) NOT NULL,
  `versionId` char(36) NOT NULL,
  `optionValue` varchar(255) NOT NULL,
  `optionLabel` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `field_options`
--

INSERT INTO `field_options` (`optionId`, `fieldId`, `versionId`, `optionValue`, `optionLabel`, `created_at`, `updated_at`) VALUES
('0ce7f643-c41b-4a1c-91ad-3034d89d409d', '91d0c3af-b1ad-4d95-a7ff-ea057ac4052a', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'Upojati', 'Upojati', '2025-12-15 12:19:19', NULL),
('d199b34b-ad08-40a8-a484-7e54d5a05d97', '91d0c3af-b1ad-4d95-a7ff-ea057ac4052a', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'FF', 'FF', '2025-12-15 12:19:19', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `form_fields`
--

CREATE TABLE `form_fields` (
  `fieldId` char(36) NOT NULL,
  `formId` char(36) NOT NULL,
  `versionId` char(36) NOT NULL,
  `fieldName` varchar(50) NOT NULL,
  `fieldType` enum('TEXT','NUMBER','DATE','FILE','DROPDOWN','RADIO','CHECKBOX','TEXTAREA','EMAIL','PHONE') NOT NULL,
  `isRequired` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('ACTIVE','INACTIVE','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `requiresDocument` tinyint(1) NOT NULL DEFAULT 0,
  `documentLabel` varchar(255) DEFAULT NULL,
  `documentRequirement` enum('RECOMMENDED','MANDATORY') NOT NULL DEFAULT 'MANDATORY',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_fields`
--

INSERT INTO `form_fields` (`fieldId`, `formId`, `versionId`, `fieldName`, `fieldType`, `isRequired`, `status`, `displayOrder`, `score`, `requiresDocument`, `documentLabel`, `documentRequirement`, `created_at`, `updated_at`) VALUES
('1b9ad71b-b6af-4112-a64e-8edf416ccac0', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'CGPA', 'TEXT', 1, 'ACTIVE', 1, 10.00, 1, 'Upload ResultSheet', 'MANDATORY', '2025-11-05 11:49:27', '2025-12-15 12:19:19'),
('47b1ef17-6e32-475f-97ed-9260eb662658', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '00e6113a-1711-4097-a3d6-0f20cf3a3c15', 'New Field', 'TEXT', 0, 'ACTIVE', 1, 10.00, 0, NULL, 'RECOMMENDED', '2025-12-26 00:45:11', '2025-12-26 01:32:35'),
('480e27ce-f010-4264-83f7-b73ab23c1348', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'Name', 'TEXT', 1, 'ACTIVE', 0, 0.00, 0, NULL, 'RECOMMENDED', '2025-11-04 14:29:49', '2025-12-15 12:19:19'),
('679a185a-ced7-40c1-ba37-0574ec85f560', 'fffb6708-20fe-44d4-b428-3d885c20d6cd', 'e139d159-d8b5-4fb4-8d6a-c8904c0922bd', 'Result', 'TEXT', 0, 'ACTIVE', 1, 0.00, 1, NULL, 'MANDATORY', '2025-11-09 22:57:49', NULL),
('6908ed34-ef82-4c41-a11a-3fc60bef0a72', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '00e6113a-1711-4097-a3d6-0f20cf3a3c15', 'New Field', 'TEXT', 0, 'ACTIVE', 0, 5.00, 0, NULL, 'RECOMMENDED', '2025-12-26 00:45:11', '2025-12-26 01:32:35'),
('81f41d4d-10b6-4637-aad8-3364f621c2da', 'fffb6708-20fe-44d4-b428-3d885c20d6cd', 'e139d159-d8b5-4fb4-8d6a-c8904c0922bd', 'Name', 'TEXT', 1, 'ACTIVE', 0, 1.00, 0, NULL, 'RECOMMENDED', '2025-11-09 22:57:49', NULL),
('91d0c3af-b1ad-4d95-a7ff-ea057ac4052a', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 'f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'Quota', 'DROPDOWN', 0, 'ACTIVE', 2, 15.00, 1, NULL, 'MANDATORY', '2025-12-15 12:19:19', NULL),
('94bb0681-7cd9-4a93-b242-8432d367c2d1', '8f24f0eb-d449-4786-b284-0138ef8a2f8b', '7dcc18be-ef43-4e16-8d59-5c254a2c9e79', 'New Field', 'TEXT', 0, 'ACTIVE', 0, 0.00, 0, NULL, 'RECOMMENDED', '2025-12-26 00:44:08', NULL),
('a1eaf748-455a-4eb1-9370-007cc7dc2219', 'cde55119-f3c1-4967-b561-18b5b41a6dfb', 'c9f22ad6-6068-41e3-8802-49df523c988f', 'Name', 'TEXT', 0, 'ACTIVE', 0, 0.00, 0, NULL, 'RECOMMENDED', '2025-11-05 15:48:25', '2025-12-14 18:56:21'),
('af1134b6-063a-4bf1-9315-0ed82b2020de', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '00e6113a-1711-4097-a3d6-0f20cf3a3c15', 'New Field', 'TEXT', 0, 'ACTIVE', 2, 0.00, 0, NULL, 'RECOMMENDED', '2025-12-26 01:32:35', NULL),
('b38ce6c4-436c-49b4-a11b-c595aac6209f', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '574136f9-ff1f-4409-a07b-5440877a3c41', 'New Field', 'TEXT', 0, 'ACTIVE', 0, 5.00, 0, NULL, 'RECOMMENDED', '2025-12-26 02:08:42', NULL),
('e5064dac-51ea-426c-a9ae-6d3150b86472', '93690181-2489-4559-8b87-456ce15599fa', 'dda27cf3-2af8-485a-9ffa-2a10d43befba', 'Hello', 'TEXT', 0, 'ACTIVE', 0, 0.00, 0, NULL, 'RECOMMENDED', '2025-12-14 18:53:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `form_responses`
--

CREATE TABLE `form_responses` (
  `responseId` char(36) NOT NULL,
  `applicationId` char(36) NOT NULL,
  `submissionDate` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_responses`
--

INSERT INTO `form_responses` (`responseId`, `applicationId`, `submissionDate`, `created_at`) VALUES
('0466838c-937c-4a6d-ab3f-78e76b6f6df8', 'ec2fe4c9-04ec-4140-8648-82a5863e26be', '2026-01-09 12:59:53', '2026-01-09 12:59:53'),
('0c7cb9e0-65a5-4294-9250-e31ff9632c52', '359d48b5-6f06-416e-8352-6dee6bd9f0bf', '2026-01-11 01:22:00', '2026-01-11 01:22:00'),
('3bb931c4-6941-44fa-a330-07a539d88f11', '8b4a5628-caef-4d29-92a3-ac3234333974', '2025-12-26 02:09:36', '2025-12-26 02:09:36'),
('4546dd8b-b510-472d-a6d0-5bdd947ae87b', '65650e77-ed20-4f84-84df-25be2d585432', '2025-12-14 19:00:58', '2025-12-14 19:00:58'),
('4a325f63-b2b9-4893-a7cd-fffbf6b6c8d8', '991329f5-552e-4f8d-a0e9-6cd6913f12e8', '2025-12-25 22:05:39', '2025-12-25 22:05:39'),
('5340590f-c99f-4a26-a1a0-34f1bf40c33e', 'e59d076e-3e13-4b04-91de-1687a066b62a', '2025-12-26 15:22:21', '2025-12-26 15:22:21'),
('6d5b1637-26c7-4117-abe4-95f900085a06', '88844505-03ef-4f9a-add8-c4584eb5eaf8', '2025-12-26 00:46:01', '2025-12-26 00:46:01'),
('919917dc-fdbf-4753-ba81-14fdf53fb3bd', 'ec42fd37-691c-49ab-be90-fad5207d71c9', '2025-11-10 00:11:24', '2025-11-10 00:11:24'),
('9973f521-7001-4bcf-ac4a-712da8d13c11', 'bb76ce59-1b85-43e8-972e-b1c9aad0e617', '2025-12-15 12:33:47', '2025-12-15 12:33:47'),
('f51884f7-aafa-4bb3-b538-43a36107d3b9', '3e720e16-d8e5-4ac0-81e3-f44208dad6af', '2025-12-26 01:37:50', '2025-12-26 01:37:50');

-- --------------------------------------------------------

--
-- Table structure for table `form_response_values`
--

CREATE TABLE `form_response_values` (
  `responseId` char(36) NOT NULL,
  `fieldId` char(36) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_response_values`
--

INSERT INTO `form_response_values` (`responseId`, `fieldId`, `value`, `created_at`) VALUES
('0466838c-937c-4a6d-ab3f-78e76b6f6df8', 'e5064dac-51ea-426c-a9ae-6d3150b86472', 'hello', '2026-01-09 12:59:53'),
('0c7cb9e0-65a5-4294-9250-e31ff9632c52', 'b38ce6c4-436c-49b4-a11b-c595aac6209f', 'Masum26', '2026-01-11 01:22:00'),
('3bb931c4-6941-44fa-a330-07a539d88f11', 'b38ce6c4-436c-49b4-a11b-c595aac6209f', 'hello world', '2025-12-26 02:09:36'),
('4546dd8b-b510-472d-a6d0-5bdd947ae87b', 'a1eaf748-455a-4eb1-9370-007cc7dc2219', 'Hasan ', '2025-12-14 19:00:58'),
('4a325f63-b2b9-4893-a7cd-fffbf6b6c8d8', 'a1eaf748-455a-4eb1-9370-007cc7dc2219', 'MAsum', '2025-12-25 22:05:39'),
('5340590f-c99f-4a26-a1a0-34f1bf40c33e', 'b38ce6c4-436c-49b4-a11b-c595aac6209f', 'Shipon,swes', '2025-12-26 15:22:21'),
('6d5b1637-26c7-4117-abe4-95f900085a06', '47b1ef17-6e32-475f-97ed-9260eb662658', 'World', '2025-12-26 00:46:01'),
('6d5b1637-26c7-4117-abe4-95f900085a06', '6908ed34-ef82-4c41-a11a-3fc60bef0a72', 'hello', '2025-12-26 00:46:01'),
('919917dc-fdbf-4753-ba81-14fdf53fb3bd', '1b9ad71b-b6af-4112-a64e-8edf416ccac0', '3.54', '2025-11-10 00:11:24'),
('919917dc-fdbf-4753-ba81-14fdf53fb3bd', '480e27ce-f010-4264-83f7-b73ab23c1348', 'Hasan Mahmud', '2025-11-10 00:11:24'),
('9973f521-7001-4bcf-ac4a-712da8d13c11', '1b9ad71b-b6af-4112-a64e-8edf416ccac0', '3.5', '2025-12-15 12:33:47'),
('9973f521-7001-4bcf-ac4a-712da8d13c11', '480e27ce-f010-4264-83f7-b73ab23c1348', 'Sazzad Mahmud', '2025-12-15 12:33:47'),
('9973f521-7001-4bcf-ac4a-712da8d13c11', '91d0c3af-b1ad-4d95-a7ff-ea057ac4052a', 'FF', '2025-12-15 12:33:47'),
('f51884f7-aafa-4bb3-b538-43a36107d3b9', '47b1ef17-6e32-475f-97ed-9260eb662658', 'test', '2025-12-26 01:37:50'),
('f51884f7-aafa-4bb3-b538-43a36107d3b9', '6908ed34-ef82-4c41-a11a-3fc60bef0a72', 'hello', '2025-12-26 01:37:50'),
('f51884f7-aafa-4bb3-b538-43a36107d3b9', 'af1134b6-063a-4bf1-9315-0ed82b2020de', '20', '2025-12-26 01:37:50');

-- --------------------------------------------------------

--
-- Table structure for table `form_sessions`
--

CREATE TABLE `form_sessions` (
  `formSessionId` char(36) NOT NULL,
  `formId` char(36) NOT NULL,
  `sessionYear` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_sessions`
--

INSERT INTO `form_sessions` (`formSessionId`, `formId`, `sessionYear`, `created_at`) VALUES
('142c3e77-b9d2-4126-8099-5b1dfe379c9f', '8f24f0eb-d449-4786-b284-0138ef8a2f8b', '2020-2021', '2025-12-26 00:44:08'),
('19d4a3a8-8bf1-430e-a6a6-b1ca3b8b2a79', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', '2021-2022', '2025-12-15 12:19:19'),
('22f90aa9-3a06-490e-942f-0d9ec87067ac', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', '2024-2025', '2025-12-15 12:19:19'),
('46c63e2e-9f6b-4e04-be57-25d3b59703af', '93690181-2489-4559-8b87-456ce15599fa', '2021-2022', '2025-12-14 18:53:29'),
('4707b6ae-4c6a-44c9-ad01-0bed04bfdd55', 'fffb6708-20fe-44d4-b428-3d885c20d6cd', '2021-2022', '2025-11-09 22:57:49'),
('673e15e9-7759-452a-846a-58d2495504c0', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '2021-2022', '2025-12-26 01:32:35'),
('6845669a-eac7-4b6f-9042-e84d230bfec2', '8f24f0eb-d449-4786-b284-0138ef8a2f8b', '2021-2022', '2025-12-26 00:44:08'),
('7c6302ab-887e-48b9-9c09-920e94b5b40d', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', '2020-2021', '2025-12-26 01:32:35'),
('a5d61a89-6396-42ec-8ac2-c86836600103', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '2020-2021', '2025-12-26 02:08:42'),
('cd2b2f37-28f8-4933-abbc-c551accb5911', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', '2021-2022', '2025-12-26 02:08:42'),
('e5c3e477-5b74-4e4c-a131-3f561fada9f3', 'cde55119-f3c1-4967-b561-18b5b41a6dfb', '2021-2022', '2025-12-14 18:56:21');

-- --------------------------------------------------------

--
-- Table structure for table `form_versions`
--

CREATE TABLE `form_versions` (
  `versionId` char(36) NOT NULL,
  `formId` char(36) NOT NULL,
  `versionNumber` int(11) NOT NULL,
  `status` enum('ACTIVE','INACTIVE','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_versions`
--

INSERT INTO `form_versions` (`versionId`, `formId`, `versionNumber`, `status`, `created_at`, `created_by`) VALUES
('00e6113a-1711-4097-a3d6-0f20cf3a3c15', 'c6dcb669-d39d-4ed1-ba35-5bcf86662b44', 1, 'ACTIVE', '2025-12-26 00:45:11', 'admin-muh'),
('574136f9-ff1f-4409-a07b-5440877a3c41', '2248c16a-44ff-4da8-a1f5-d7e72468bd87', 1, 'ACTIVE', '2025-12-26 02:08:42', 'admin-muh'),
('7dcc18be-ef43-4e16-8d59-5c254a2c9e79', '8f24f0eb-d449-4786-b284-0138ef8a2f8b', 1, 'ACTIVE', '2025-12-26 00:44:08', 'admin-muh'),
('c9f22ad6-6068-41e3-8802-49df523c988f', 'cde55119-f3c1-4967-b561-18b5b41a6dfb', 1, 'ACTIVE', '2025-11-05 15:48:25', 'admin-muh'),
('dda27cf3-2af8-485a-9ffa-2a10d43befba', '93690181-2489-4559-8b87-456ce15599fa', 1, 'ACTIVE', '2025-12-14 18:53:29', 'admin-ash'),
('e139d159-d8b5-4fb4-8d6a-c8904c0922bd', 'fffb6708-20fe-44d4-b428-3d885c20d6cd', 1, 'ACTIVE', '2025-11-09 22:57:49', 'admin-ash'),
('f26879fa-6f67-4ff2-936e-a5bf8ab6f377', 'e6890c27-f3b5-41e0-958c-dc1c21649c29', 1, 'ACTIVE', '2025-11-04 14:29:49', 'admin-muh');

-- --------------------------------------------------------

--
-- Table structure for table `halls`
--

CREATE TABLE `halls` (
  `hallId` char(36) NOT NULL,
  `hallCode` char(3) NOT NULL,
  `hallName` varchar(100) NOT NULL,
  `capacity` int(11) NOT NULL,
  `gender` enum('MALE','FEMALE') NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `totalRooms` int(11) NOT NULL,
  `provostName` varchar(100) DEFAULT NULL,
  `provostContact` varchar(15) DEFAULT NULL,
  `provostEmail` varchar(100) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `halls`
--

INSERT INTO `halls` (`hallId`, `hallCode`, `hallName`, `capacity`, `gender`, `location`, `description`, `totalRooms`, `provostName`, `provostContact`, `provostEmail`, `imageUrl`, `status`, `created_at`, `updated_at`) VALUES
('hall-ash', 'ASH', 'Basha Shaheed Abdus Salam Hall', 400, 'MALE', 'NSTU Campus, Sonapur, Noakhali-3814', 'Hall for male students with modern facilities.', 120, 'Md. Farid Dewan', '+8801717386048', 'provost.ash@nstu.edu.bd', '/halls/ASH.jpg', 'ACTIVE', '2025-10-28 20:53:35', NULL),
('hall-bkh', 'BKH', 'Hazrat Bibi Khadiza Hall', 300, 'FEMALE', 'NSTU Campus, Sonapur, Noakhali-3814', 'Female hall with secure accommodations.', 100, 'Hall Provost', '+880-XXXX-XXXXX', 'provost.bkh@nstu.edu.bd', '/halls/BKH.jpg', 'ACTIVE', '2025-10-28 20:53:35', NULL),
('hall-jsh', 'JSH', 'Shahid Smriti Chatri Hall', 400, 'MALE', 'NSTU Campus, Sonapur, Noakhali-3814', 'Male hall dedicated to Shahid Smriti Chatri.', 120, 'Hall Provost', '+880-XXXX-XXXXX', 'provost.jsh@nstu.edu.bd', '/halls/JSH.jpg', 'ACTIVE', '2026-01-09 20:06:54', NULL),
('hall-muh', 'MUH', 'Bir Muktijuddha Abdul Malek Ukil Hall', 350, 'MALE', 'NSTU Campus, Sonapur, Noakhali-3814', 'Residential hall dedicated to Bir Muktijuddha Abdul Malek Ukil.', 110, 'Hall Provost', '+880-XXXX-XXXXX', 'provost.muh@nstu.edu.bd', '/halls/MUH.jpg', 'ACTIVE', '2025-10-28 20:53:35', NULL),
('hall-nfh', 'NFH', 'Nawab Faizunnesa Choudhurani Hall', 350, 'FEMALE', 'NSTU Campus, Sonapur, Noakhali-3814', 'Female hall dedicated to Nawab Faizunnesa Choudhurani.', 110, 'Hall Provost', '+880-XXXX-XXXXX', 'provost.nfh@nstu.edu.bd', '/halls/NFH.jpg', 'ACTIVE', '2026-01-09 20:06:54', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `interviews`
--

CREATE TABLE `interviews` (
  `interviewId` char(36) NOT NULL,
  `applicationId` char(36) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(16) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `interviewScore` decimal(5,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interviews`
--

INSERT INTO `interviews` (`interviewId`, `applicationId`, `date`, `time`, `venue`, `interviewScore`, `created_at`, `updated_at`, `status`) VALUES
('283e632c-2cec-4e1c-95f3-85b994dc4abe', 'bb76ce59-1b85-43e8-972e-b1c9aad0e617', '2025-12-24', '16:58', 'Hall office', 0.00, '2025-12-25 02:45:58', '2025-12-25 04:58:42', 1),
('359247f9-7b47-46e2-aead-80d9ff92aade', '88844505-03ef-4f9a-add8-c4584eb5eaf8', '2025-01-10', '00:47', 'ADI', 20.00, '2025-12-26 00:47:44', '2025-12-26 00:47:57', 1),
('51e94620-b814-4892-8f46-ac1f43a4ed88', '991329f5-552e-4f8d-a0e9-6cd6913f12e8', '2026-01-02', '10:11', 'hall office', 50.00, '2025-12-25 22:11:24', '2025-12-25 22:11:38', 1),
('5633ca26-ff37-4d8c-9c41-1ffc466e02fa', '3e720e16-d8e5-4ac0-81e3-f44208dad6af', '2025-12-26', '01:38', 'adi', 30.00, '2025-12-26 01:39:09', '2025-12-26 01:39:22', 1),
('6bb9d7eb-b3d3-4854-9756-3bd17509d536', '359d48b5-6f06-416e-8352-6dee6bd9f0bf', '2026-01-12', '01:24', 'hall office', 50.00, '2026-01-11 01:24:13', '2026-01-11 01:24:43', 1),
('754262ca-569b-46e0-8063-bb61593a1202', '8b4a5628-caef-4d29-92a3-ac3234333974', '2025-12-26', '02:10', 'adi', 5.00, '2025-12-26 02:10:17', '2025-12-26 02:10:41', 1),
('9762fc35-145b-4132-a80e-16986e0e65c7', 'ec42fd37-691c-49ab-be90-fad5207d71c9', '2025-12-24', '16:58', 'Hall office', 10.00, '2025-12-25 02:45:58', '2025-12-25 04:58:42', 1),
('a470ef4f-24f6-46ae-89ac-957ca90f8037', 'a7ec2b54-8c3c-4e34-b284-c5519b663cef', '2025-12-24', '16:58', 'Hall office', 0.00, '2025-12-25 04:58:42', '2025-12-25 04:59:54', 1),
('c24cbf05-a0da-4415-87ba-bf9a565fee4f', 'ec2fe4c9-04ec-4140-8648-82a5863e26be', '2025-01-25', '01:08', 'Library', 30.00, '2026-01-09 13:08:07', '2026-01-09 13:08:25', 1),
('df18b891-5bd6-4b14-9958-29163c1dfb58', 'e59d076e-3e13-4b04-91de-1687a066b62a', '2025-12-26', '15:22', 'adi', 20.00, '2025-12-26 15:23:03', '2025-12-26 15:23:40', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notificationId` char(36) NOT NULL,
  `hallId` char(36) DEFAULT NULL,
  `userId` char(36) DEFAULT NULL,
  `title` varchar(120) NOT NULL,
  `body` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notificationId`, `hallId`, `userId`, `title`, `body`, `created_at`) VALUES
('053a472f-376f-4141-b077-9c9c0f2f27af', 'hall-muh', 'MUH2233020M', 'Renewal Approved', 'Your renewal request for 2021 was approved. New seat expiry: 2026-12-31.', '2025-12-26 15:34:12'),
('09e97953-d5df-49c5-81e1-f1f212f59b75', 'hall-muh', 'MUH2125020M', 'Interview Scheduled', 'Your interview for \"Test-20\" is scheduled on 2025-12-26 at 01:38 in adi.', '2025-12-26 01:39:09'),
('0fef5488-d4f0-4996-873d-08bcf84a9c8f', 'hall-ash', NULL, 'test notification', 'Apply for seat', '2025-12-24 14:01:02'),
('2a2120fa-411e-461c-95e2-cb904107e1cb', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2334-12-31 at 14:34 in abc.', '2025-12-25 02:34:19'),
('2b96fe55-2fe4-4636-9fc2-5e0665bc5a45', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 4566-12-31 at 15:33 in abc.', '2025-12-25 02:32:39'),
('2cb40634-0e8d-449e-ba0d-fd42a399d9eb', 'hall-muh', 'MUH2225026M', 'Interview Scheduled', 'Your interview for \"Test-21\" is scheduled on 2026-01-12 at 01:24 in hall office.', '2026-01-11 01:24:13'),
('334db500-b10e-4ca5-8726-6c878ee52a42', NULL, NULL, 'huttt', '', '2026-01-10 01:41:22'),
('339aa1a9-6bea-4bc5-900b-31453e1172dc', 'hall-muh', 'MUH2125020M', 'Interview Scheduled', 'Your interview for \"Test-21\" is scheduled on 2025-12-26 at 02:10 in adi.', '2025-12-26 02:10:17'),
('33f32a7f-5b64-4b7a-8d19-b4512e1e2899', 'hall-muh', 'MUH2233020M', 'Renewal Submitted', 'Your renewal request for 2021 has been submitted and is pending admin review.', '2025-12-26 15:32:44'),
('38d9bbdc-aa27-46f6-96d9-0d7c7702205a', 'hall-muh', 'student-muh', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 0025-02-01 at 10:38 in adi.', '2025-12-24 22:39:03'),
('419f45e0-59da-49f1-9d16-f8af4916443f', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2025-12-17 at 12:24 in Audi.', '2025-12-16 12:22:28'),
('586eddc5-1877-4e8b-8d30-57dc690897a6', 'hall-muh', 'student-muh', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2025-12-24 at 16:58 in Hall office.', '2025-12-25 04:58:42'),
('5cd952a4-2e71-436b-bb3f-1a07691cf568', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2026-12-02 at 14:45 in Hall Office.', '2025-12-25 02:45:58'),
('73a084b8-b291-44ca-a24d-7fcb0d608325', NULL, NULL, 'New Exam Seat Plan Available', '', '2026-01-10 01:40:28'),
('78cc5ff6-e584-4ea3-90bb-9c24f20ee95e', 'hall-ash', 'ASH2225033M', 'Seat Allocated', 'Your seat has been allocated. Room 101. Seat expiry: 2027-01-09.', '2026-01-09 13:08:36'),
('798e49f4-c621-418a-9cd6-14ab9295fed4', 'hall-muh', 'MUH2233020M', 'Seat Allocated', 'Your seat has been allocated. Room 203. Seat expiry: 2025-12-31.', '2025-12-26 15:24:49'),
('7a7eb203-e511-4139-86f6-a8ae3bce405d', 'hall-muh', 'MUH2233020M', 'Interview Scheduled', 'Your interview for \"Test-21\" is scheduled on 2025-12-26 at 15:22 in adi.', '2025-12-26 15:23:03'),
('7eb412db-a362-4ce2-9a10-23d8899ec171', 'hall-muh', 'MUH2225030M', 'Interview Scheduled', 'Your interview for form cde55119-f3c1-4967-b561-18b5b41a6dfb is scheduled on 2026-01-02 at 10:11 in hall office.', '2025-12-25 22:11:24'),
('86e46084-73bc-4a1c-821b-b14cfdb945ab', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 0025-02-01 at 10:38 in adi.', '2025-12-24 22:39:03'),
('8e94eaa2-032b-499f-8a85-49bff37cf749', 'hall-muh', 'MUH2225026M', 'Seat Allocated', 'Your seat has been allocated. Room 101. Seat expiry: 2027-01-10.', '2026-01-11 01:26:35'),
('98940cc8-d74c-44d3-a484-73496841aa99', 'hall-muh', 'student-muh', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2334-12-31 at 14:34 in abc.', '2025-12-25 02:34:19'),
('9a936b5c-3f34-4f0a-ae93-c672c171e5b7', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2025-12-24 at 16:58 in Hall office.', '2025-12-25 04:58:42'),
('ac98d4eb-b6b8-4c5a-9e91-cd81602e76af', 'hall-muh', '1454f781-e5f6-49e1-8ed7-f32599263e71', 'Seat Allocated', 'Your seat has been allocated. Room 101. Seat expiry: 2027-01-10.', '2026-01-11 03:26:34'),
('b0a7b4f7-bd04-4196-8229-ddc1cbc95797', 'hall-ash', 'ASH2225033M', 'Interview Scheduled', 'Your interview for \"Test1\" is scheduled on 2025-01-25 at 01:08 in Library.', '2026-01-09 13:08:07'),
('b3c3af0c-ef7a-4590-abeb-b1707fec1c28', 'hall-muh', 'MUH2125020M', 'Seat Cancelled', 'Your seat was cancelled because the 4-year allotment period ended and no active renewal was found for 2025.', '2025-12-26 02:05:06'),
('b5239f0a-dbec-4546-8ff7-7af4d82ce031', 'hall-muh', 'MUH2225001M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2344-12-23 at 02:03 in office.', '2025-12-25 02:03:23'),
('ca727492-6a27-470a-a7a7-5fa86cdd0cbd', NULL, NULL, 'New Exam Result Available', '', '2026-01-10 01:40:59'),
('d324845a-0a10-411c-9036-7c1c0188257e', 'hall-muh', 'MUH2125013M', 'Seat Cancelled', 'Your seat was cancelled because the 4-year allotment period ended and no active renewal was found for 2025.', '2025-12-26 01:03:20'),
('d7c0cf36-2a3b-498d-945a-3b0e4c9aa2f7', 'hall-muh', 'student-muh', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2026-12-02 at 14:45 in Hall Office.', '2025-12-25 02:45:58'),
('dcb9d01e-97cb-4b10-aa05-25b62c4846f9', 'hall-muh', NULL, 'Allotment-2025', 'Application start from March', '2025-12-16 21:13:55'),
('dee6d572-69ef-4bca-9d27-7cfa37b7bfe7', 'hall-muh', 'student-muh', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2344-12-23 at 02:03 in office.', '2025-12-25 02:03:23'),
('f261f12f-ba55-4d83-9b99-9c2d569c38e2', NULL, NULL, 'New Exam Seat Plan Available', '', '2026-01-10 01:42:04'),
('f61fa375-c892-43bf-bb7a-556d4383cb22', 'hall-muh', 'MUH2125013M', 'Interview Scheduled', 'Your interview for \"Test-20\" is scheduled on 2025-01-10 at 00:47 in ADI.', '2025-12-26 00:47:44'),
('fc144094-4c22-4116-8ecb-8d520bcf9dc9', 'hall-muh', 'MUH2225013M', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 2025-12-24 at 16:58 in Hall office.', '2025-12-25 04:58:42'),
('ff6b2fc9-a36e-4d76-803b-141aba43e55f', 'hall-muh', 'student-muh', 'Interview Scheduled', 'Your interview for form e6890c27-f3b5-41e0-958c-dc1c21649c29 is scheduled on 4566-12-31 at 15:33 in abc.', '2025-12-25 02:32:39');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `paymentId` char(36) NOT NULL,
  `studentId` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','PAID','FAILED','REFUNDED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `paymentType` enum('ADMISSION_FEE','MONTHLY_RENT','SECURITY_DEPOSIT','FINE','UTILITY_BILL','CAUTION_MONEY','OTHER') NOT NULL DEFAULT 'OTHER',
  `invoiceId` varchar(100) DEFAULT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  `paymentMethod` varchar(50) DEFAULT NULL,
  `paidAt` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `renewals`
--

CREATE TABLE `renewals` (
  `renewalId` char(36) NOT NULL,
  `studentId` char(36) NOT NULL,
  `allocationId` char(36) NOT NULL,
  `academicYear` varchar(10) NOT NULL,
  `status` enum('PENDING','UNDER_REVIEW','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `applicationDate` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewedBy` char(36) DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL,
  `attachmentId` char(36) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `renewals`
--

INSERT INTO `renewals` (`renewalId`, `studentId`, `allocationId`, `academicYear`, `status`, `applicationDate`, `reviewedBy`, `reviewedAt`, `approvedAt`, `rejectionReason`, `attachmentId`, `remarks`, `created_at`, `updated_at`) VALUES
('53dbaedf-062b-4087-b0bf-ed4e17ea22be', 'MUH2225030M', '57c72a7a-f391-4d51-a095-f231c5f9c557', '2021', 'REJECTED', '2025-12-26 01:09:48', 'admin-muh', '2025-12-26 01:11:00', NULL, 'Rejected', NULL, 'not complete', '2025-12-26 01:09:48', '2025-12-26 01:11:00'),
('6a8e2d70-d2d6-4ea6-8b34-703edee7c9d1', 'MUH2225030M', '57c72a7a-f391-4d51-a095-f231c5f9c557', '2021-22', 'APPROVED', '2025-12-26 01:05:26', 'admin-muh', '2025-12-26 01:08:07', '2025-12-26 01:08:07', NULL, NULL, 'not complete yet', '2025-12-26 01:05:26', '2025-12-26 01:08:07'),
('755a40fe-249d-49b8-b8ba-b06ad71411b2', 'MUH2233020M', 'b0d47146-1ddf-4f42-a175-7070ba818c51', '2021', 'APPROVED', '2025-12-26 15:32:44', 'admin-muh', '2025-12-26 15:34:12', '2025-12-26 15:34:12', NULL, NULL, 'not complete', '2025-12-26 15:32:44', '2025-12-26 15:34:12'),
('98ef6ded-740d-4bdd-9f15-c2a5ce21d2b2', 'MUH2225030M', '57c72a7a-f391-4d51-a095-f231c5f9c557', '2020', 'APPROVED', '2025-12-26 01:26:58', 'admin-muh', '2025-12-26 01:28:09', '2025-12-26 01:28:09', NULL, NULL, 'not complete', '2025-12-26 01:26:58', '2025-12-26 01:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `roomId` char(36) NOT NULL,
  `hallId` char(36) NOT NULL,
  `roomNumber` varchar(10) NOT NULL,
  `floorNumber` int(11) NOT NULL,
  `capacity` int(11) NOT NULL,
  `currentOccupancy` int(11) NOT NULL DEFAULT 0,
  `roomType` enum('SINGLE','DOUBLE','TRIPLE','QUAD') NOT NULL,
  `status` enum('AVAILABLE','OCCUPIED','MAINTENANCE','UNDER_REPAIR','RESERVED') NOT NULL DEFAULT 'AVAILABLE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`roomId`, `hallId`, `roomNumber`, `floorNumber`, `capacity`, `currentOccupancy`, `roomType`, `status`, `created_at`, `updated_at`) VALUES
('0cff39b9-6137-4516-92ec-d663a219f0c0', 'hall-muh', '101', 1, 5, 3, 'DOUBLE', 'AVAILABLE', '2025-12-24 22:15:22', '2026-01-11 03:26:34'),
('455a0fec-495b-4b20-b6e5-d445cb6c8cbf', 'hall-muh', '501', 5, 6, 0, 'DOUBLE', 'AVAILABLE', '2025-12-25 00:49:26', '2025-12-26 02:37:49'),
('512a429d-7500-4e10-b3e8-3aad776fdc01', 'hall-ash', '101', 1, 6, 1, 'SINGLE', 'AVAILABLE', '2025-12-24 22:11:35', '2026-01-09 13:08:36'),
('5236787b-8464-4167-bda8-c2cc36fce071', 'hall-ash', '102', 1, 10, 0, 'DOUBLE', 'AVAILABLE', '2025-12-24 22:12:25', NULL),
('db39fcde-8794-41d6-9683-44e9d3a71341', 'hall-ash', '503', 5, 5, 0, 'SINGLE', 'AVAILABLE', '2025-12-26 06:40:26', NULL),
('de856ed2-6896-49a1-a4cd-e568551f57da', 'hall-muh', '203', 2, 6, 2, 'SINGLE', 'AVAILABLE', '2025-12-25 01:50:17', '2025-12-26 15:24:49');

-- --------------------------------------------------------

--
-- Table structure for table `staff_profiles`
--

CREATE TABLE `staff_profiles` (
  `userId` char(36) NOT NULL,
  `designation` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `hallId` char(36) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `responsibilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`responsibilities`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff_profiles`
--

INSERT INTO `staff_profiles` (`userId`, `designation`, `department`, `hallId`, `phone`, `photoUrl`, `responsibilities`, `created_at`, `updated_at`, `created_by`) VALUES
('staff-ash', 'Hall Manager', 'Student Welfare', 'hall-ash', '+8801800000001', NULL, '[\"Handle student complaints\",\"Coordinate with provost\",\"Monitor hall discipline\",\"Manage student grievances\"]', '2026-01-09 19:53:14', NULL, NULL),
('staff-bkh', 'Hall Manager', 'Student Welfare', 'hall-bkh', '+8801900000001', NULL, '[\"Handle student complaints\",\"Coordinate with provost\",\"Monitor hall discipline\",\"Manage student grievances\"]', '2026-01-09 19:53:14', NULL, NULL),
('staff-jsh', 'Hall Manager', 'Student Welfare', 'hall-jsh', '+8801800000003', NULL, '[\"Handle student complaints\",\"Coordinate with provost\",\"Monitor hall discipline\",\"Manage student grievances\"]', '2026-01-09 20:06:54', NULL, NULL),
('staff-muh', 'Hall Manager', 'Student Welfare', 'hall-muh', '+8801700000001', NULL, '[\"Handle student complaints\",\"Coordinate with provost\",\"Monitor hall discipline\",\"Manage student grievances\"]', '2026-01-09 19:53:14', NULL, NULL),
('staff-nfh', 'Hall Manager', 'Student Welfare', 'hall-nfh', '+8801700000003', NULL, '[\"Handle student complaints\",\"Coordinate with provost\",\"Monitor hall discipline\",\"Manage student grievances\"]', '2026-01-09 20:06:54', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_allocations`
--

CREATE TABLE `student_allocations` (
  `allocationId` char(36) NOT NULL,
  `studentId` char(36) NOT NULL,
  `roomId` char(36) NOT NULL,
  `applicationId` char(36) NOT NULL,
  `paymentId` char(36) DEFAULT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime DEFAULT NULL,
  `status` enum('PENDING','ALLOCATED','ACTIVE','REJECTED','CANCELLED','VACATED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `allocationDate` datetime DEFAULT NULL,
  `vacatedDate` datetime DEFAULT NULL,
  `vacationReason` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_allocations`
--

INSERT INTO `student_allocations` (`allocationId`, `studentId`, `roomId`, `applicationId`, `paymentId`, `startDate`, `endDate`, `status`, `allocationDate`, `vacatedDate`, `vacationReason`, `remarks`, `created_at`, `updated_at`, `created_by`, `updated_by`, `reason`) VALUES
('14763226-55bf-4905-a19f-852ac12f9df4', 'MUH2225026M', '0cff39b9-6137-4516-92ec-d663a219f0c0', '359d48b5-6f06-416e-8352-6dee6bd9f0bf', NULL, '2026-01-11 01:26:35', '2027-01-11 01:26:35', 'ALLOCATED', '2026-01-11 01:26:35', NULL, NULL, NULL, '2026-01-11 01:26:35', NULL, 'admin-muh', NULL, NULL),
('15d6805e-1c88-437f-b04b-0f54c5b4fa6b', 'ASH2225033M', '512a429d-7500-4e10-b3e8-3aad776fdc01', 'ec2fe4c9-04ec-4140-8648-82a5863e26be', NULL, '2026-01-09 13:08:36', '2027-01-09 13:08:36', 'ALLOCATED', '2026-01-09 13:08:36', NULL, NULL, NULL, '2026-01-09 13:08:36', NULL, 'admin-ash', NULL, NULL),
('1e30773d-dc0a-4a2d-beab-4dcf08587ab1', 'MUH2125020M', 'de856ed2-6896-49a1-a4cd-e568551f57da', '8b4a5628-caef-4d29-92a3-ac3234333974', NULL, '2025-12-26 02:11:08', NULL, 'ALLOCATED', '2025-12-26 02:11:08', NULL, NULL, NULL, '2025-12-26 02:11:08', NULL, 'admin-muh', NULL, NULL),
('5142b022-de6e-4415-af1f-172bb21c81a7', '1454f781-e5f6-49e1-8ed7-f32599263e71', '0cff39b9-6137-4516-92ec-d663a219f0c0', '0665945f-dcac-4e3a-a4dd-deeda4ea37ae', NULL, '2026-01-11 03:26:34', '2026-03-11 03:26:34', 'ALLOCATED', '2026-01-11 03:26:34', NULL, NULL, NULL, '2026-01-11 03:26:34', '2026-01-11 03:45:11', 'admin-muh', NULL, 'FOR PHD STUDENT'),
('52bf1ba4-2cc9-449e-84e0-4fbb731b96a6', 'student-muh', '0cff39b9-6137-4516-92ec-d663a219f0c0', 'ec42fd37-691c-49ab-be90-fad5207d71c9', NULL, '2025-12-25 04:13:35', NULL, 'VACATED', '2025-12-25 04:13:35', '2025-12-25 04:40:54', 'hoday', NULL, '2025-12-25 04:13:35', '2025-12-25 04:40:54', 'admin-muh', 'admin-muh', 'needs'),
('57c72a7a-f391-4d51-a095-f231c5f9c557', 'MUH2225030M', '0cff39b9-6137-4516-92ec-d663a219f0c0', '991329f5-552e-4f8d-a0e9-6cd6913f12e8', NULL, '2025-12-25 22:11:54', '2026-07-01 00:00:00', 'ALLOCATED', '2025-12-25 22:11:54', NULL, NULL, NULL, '2025-12-25 22:11:54', '2025-12-26 01:28:09', 'admin-muh', NULL, NULL),
('60831432-19a4-48e5-b055-7a414fd1b7df', 'MUH2125020M', 'de856ed2-6896-49a1-a4cd-e568551f57da', '3e720e16-d8e5-4ac0-81e3-f44208dad6af', NULL, '2025-12-26 01:40:17', '2025-12-26 02:05:06', 'EXPIRED', '2025-12-26 01:40:17', NULL, NULL, '', '2025-12-26 01:40:17', '2025-12-26 02:05:06', 'admin-muh', NULL, 'Auto-cancel: renewal not submitted/approved before expiry'),
('8d327f61-89cb-4611-a9a4-0f3f83848f2b', 'MUH2225001M', 'de856ed2-6896-49a1-a4cd-e568551f57da', 'bb76ce59-1b85-43e8-972e-b1c9aad0e617', NULL, '2025-12-25 04:14:49', NULL, 'VACATED', '2025-12-25 04:14:49', '2025-12-25 04:40:54', 'hoday', NULL, '2025-12-25 04:14:49', '2025-12-25 04:40:54', 'admin-muh', 'admin-muh', NULL),
('9db0b242-b66c-427b-8adf-017d34aee9a6', 'MUH2225001M', '0cff39b9-6137-4516-92ec-d663a219f0c0', 'bb76ce59-1b85-43e8-972e-b1c9aad0e617', NULL, '2025-12-25 05:00:21', NULL, 'VACATED', '2025-12-25 05:00:21', '2025-12-26 04:21:58', 'hoday', NULL, '2025-12-25 05:00:21', '2025-12-26 04:21:58', 'admin-muh', 'admin-muh', NULL),
('b0d47146-1ddf-4f42-a175-7070ba818c51', 'MUH2233020M', 'de856ed2-6896-49a1-a4cd-e568551f57da', 'e59d076e-3e13-4b04-91de-1687a066b62a', NULL, '2025-12-26 15:24:49', '2027-01-01 00:00:00', 'ALLOCATED', '2025-12-26 15:24:49', NULL, NULL, NULL, '2025-12-26 15:24:49', '2025-12-26 15:34:12', 'admin-muh', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_profiles`
--

CREATE TABLE `student_profiles` (
  `userId` char(36) NOT NULL,
  `hallId` char(36) DEFAULT NULL,
  `universityId` varchar(20) NOT NULL,
  `programLevel` varchar(20) DEFAULT NULL,
  `phone` varchar(15) NOT NULL,
  `address` text NOT NULL,
  `department` varchar(100) NOT NULL,
  `academicYear` int(11) NOT NULL,
  `sessionYear` varchar(9) DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `studentIdCardUrl` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_profiles`
--

INSERT INTO `student_profiles` (`userId`, `hallId`, `universityId`, `programLevel`, `phone`, `address`, `department`, `academicYear`, `sessionYear`, `photoUrl`, `studentIdCardUrl`, `created_at`, `updated_at`) VALUES
('1454f781-e5f6-49e1-8ed7-f32599263e71', 'hall-muh', 'MUH25PHD12M', 'phd', '0000000000', 'Not provided', 'Not provided', 0, NULL, NULL, NULL, '2026-01-11 02:36:23', '2026-01-11 03:25:48'),
('7ef8b997-6e54-4d59-bce0-38901e9fe946', NULL, 'MUH22MSSE13M', NULL, '0000000000', 'Not provided', 'Not provided', 0, NULL, NULL, NULL, '2026-01-11 02:09:00', NULL),
('ASH2225026M', 'hall-ash', 'ASH2225026M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2021-2022', NULL, NULL, '2025-11-09 23:00:11', '2026-01-11 02:26:45'),
('ASH2225033M', 'hall-ash', 'ASH2225033M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2021-2022', NULL, NULL, '2026-01-02 23:40:30', '2026-01-11 02:26:45'),
('e71c1b15-aaba-49cd-84ef-05c68b5c493b', NULL, 'MUH22MSE13M', NULL, '0000000000', 'Not provided', 'Not provided', 0, '2021-2022', NULL, NULL, '2026-01-11 01:59:57', '2026-01-11 02:00:31'),
('MUH2125013M', NULL, 'MUH2125013M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2020-2021', '/uploads/profile-photos/9a961e97-ab0a-4a65-88f0-88b27cb6e30a.jpg', NULL, '2025-12-26 00:38:41', '2026-01-11 02:26:45'),
('MUH2125020M', 'hall-muh', 'MUH2125020M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2020-2021', NULL, NULL, '2025-12-26 01:36:52', '2026-01-11 02:26:45'),
('MUH2225001M', 'hall-muh', 'MUH2225001M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2021-2022', NULL, NULL, '2025-12-15 12:00:12', '2026-01-11 02:26:45'),
('MUH2225026M', 'hall-muh', 'MUH2225026M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2021-2022', '/uploads/profile-photos/f9208704-02d9-48ac-a72d-629eeb69f168.jpg', NULL, '2026-01-11 01:20:44', '2026-01-11 02:26:45'),
('MUH2225055M', 'hall-muh', 'MUH2225055M', 'undergraduate', '0000000000', 'Not provided', 'IIT', 0, '2021-2022', NULL, NULL, '2026-01-03 01:16:53', '2026-01-11 02:26:45'),
('MUH2233020M', 'hall-muh', 'MUH2233020M', 'undergraduate', '0000000000', 'Not provided', 'SWES', 0, '2021-2022', NULL, NULL, '2025-12-26 15:21:41', '2026-01-11 02:26:45'),
('student-muh', 'hall-muh', 'MUH2225007M', 'undergraduate', '+8801600000000', 'Noakhali', 'IIT', 3, '2021-2022', NULL, NULL, '2025-10-28 20:53:37', '2026-01-11 02:26:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` char(36) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('STUDENT','ADMIN','EXAM_CONTROLLER','STAFF') NOT NULL,
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastLogin` datetime DEFAULT NULL,
  `passwordChangedAt` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `email`, `password`, `name`, `role`, `isEmailVerified`, `isActive`, `lastLogin`, `passwordChangedAt`, `created_at`, `updated_at`) VALUES
('1454f781-e5f6-49e1-8ed7-f32599263e71', 'phd@student.nstu.edu.bd', '$2b$10$MrlJcTJmr4bhRZkwBttZhuYAk6GaGca0kytZwenX34o1.Q9vvJUI2', 'PHD', 'STUDENT', 0, 1, '2026-01-11 03:28:05', NULL, '2026-01-11 02:36:23', '2026-01-11 03:28:05'),
('7af02602-d3cb-49b2-85fc-4d3c0a66eec2', 'tawsiq@student.nstu.edu.bd', '$2b$10$V0a8chAa5NXWgwC0hqePDezRubRAdt3s9ZmultrR83cdvS3nicjPy', 'Tawsiq Mahmud', 'STUDENT', 0, 1, '2025-11-05 15:52:47', NULL, '2025-10-29 00:35:34', '2025-11-05 15:52:47'),
('7ef8b997-6e54-4d59-bce0-38901e9fe946', 'rahim222@student.nstu.edu.bd', '$2b$10$TYofGmen9zsIAElgZ3Nrou2y/oNm5sBkon43YNedx6B.ninXiK8pW', 'Rahim', 'STUDENT', 0, 1, '2026-01-11 03:27:13', NULL, '2026-01-11 02:09:00', '2026-01-11 03:27:13'),
('admin-ash', 'admin.ash@nstu.edu.bd', '$2b$10$fuCh4ZjlhTvRbkhmvcamGuQ6X7Tu0M4eo345f5dlUpAyVr433Gg8y', 'Admin - Abdus Salam Hall', 'ADMIN', 1, 1, '2026-01-11 05:11:13', NULL, '2025-10-28 20:53:36', '2026-01-11 05:11:13'),
('admin-muh', 'admin.muh@nstu.edu.bd', '$2b$10$ew6W66m07jGrZ1ETkEzKzOFcp77EDXfl952jiQZMUyXobDGKVEyuC', 'Admin - Abdul Malek Ukil Hall', 'ADMIN', 1, 1, '2026-01-11 03:51:48', NULL, '2025-10-28 20:53:36', '2026-01-11 03:51:48'),
('ASH2225026M', 'tanjim2517@student.nstu.edu.bd', '$2b$10$ag1X.SW489/MYZsTWjQ03OKOsZAWH27kUtKp2JJRaWVg/IVO4WbBe', 'Tanjim Arafat', 'STUDENT', 0, 1, '2025-12-14 18:54:44', NULL, '2025-11-09 23:00:11', '2025-12-14 18:54:44'),
('ASH2225033M', 'adib2517@student.nstu.edu.bd', '$2b$10$XTXL910zLLCr5EI.MozWiulE7UrCCdPBv5ZDhpTDKHFHHPyfN1F9K', 'Tafhimul Adib', 'STUDENT', 0, 1, '2026-01-09 13:08:53', NULL, '2026-01-02 23:40:30', '2026-01-09 13:08:53'),
('e71c1b15-aaba-49cd-84ef-05c68b5c493b', 'msce@student.nstu.edu.bd', '$2b$10$xgJPwlMspjcgqYsd2FJQSuQr6R/i3PKhIHiDbr2XpCZKy9ZrYZ6NS', 'MasumMSSE', 'STUDENT', 0, 1, NULL, NULL, '2026-01-11 01:59:57', NULL),
('exam-controller-main', 'exam@nstu.edu.bd', '$2b$10$MNKiXSJyYpfMRLo25rmRFeprbFfBk3hHkSrBFpZ3Ox7iC7XzpgliW', 'Exam Controller', 'EXAM_CONTROLLER', 1, 1, '2026-01-10 20:16:02', NULL, '2026-01-10 01:27:15', '2026-01-10 20:16:02'),
('fac211dd-2071-4706-b27e-46ec2a28ad6b', 'masumms@student.nstu.edu.bd', '$2b$10$9T3C6syJwUOW9bos9f2Q2.Nxq0CxOj/Xx/QuQUhNNMPHiZZQD9zR.', 'MUH22BSSE25M', 'STUDENT', 0, 1, '2026-01-11 01:32:31', NULL, '2026-01-11 01:29:35', '2026-01-11 01:32:31'),
('MUH2125013M', 'masum21@student.nstu.edu.bd', '$2b$10$UlRXx0zVW0ubwng9W.W1juqoY0HctMWVf9iwep7ffCgczsAZUNu7W', 'Masum', 'STUDENT', 0, 1, '2026-01-11 00:58:01', NULL, '2025-12-26 00:38:41', '2026-01-11 00:58:01'),
('MUH2125020M', 'masum20@student.nstu.edu.bd', '$2b$10$UJrbkdqVhyDZDB2JeSQ2PuQLpx72VP0slkueWxeQyF0EGXcRSpZkO', 'masum', 'STUDENT', 0, 1, '2025-12-26 02:11:46', NULL, '2025-12-26 01:36:52', '2025-12-26 02:11:46'),
('MUH2225001M', 'sazzad@student.nstu.edu.bd', '$2b$10$zoZpDMu2/pzlq5FWjsaDKuFKgdfZdDaHpXTBb85r3oWoDSLyvc482', 'Sazzad Mahmud', 'STUDENT', 0, 1, '2025-12-16 21:14:38', NULL, '2025-12-15 12:00:12', '2025-12-16 21:14:38'),
('MUH2225013M', 'masum2517@student.nstu.edu.bd', '$2b$10$jhKHGJaRD/s5/PY3Q3XmT.avwowKsHMikqCx3p4Y4Uidk5uQYn4Z6', 'Masum Bhuian', 'STUDENT', 0, 1, '2025-11-05 16:08:07', NULL, '2025-11-03 12:36:09', '2025-11-05 16:08:07'),
('MUH2225025M', 'masum09@student.nstu.edu.bd', '$2b$10$GfVPe9vhUHNZB.GiDTuyU.VsAtPOP622ta86LINu91gfuIyUMc9hK', 'masum212', 'STUDENT', 0, 1, NULL, NULL, '2026-01-11 01:04:29', NULL),
('MUH2225026M', 'masum1234@student.nstu.edu.bd', '$2b$10$p6MaXrH3skLcm/72ed448e6BNvXE5tj.bIhXb/6hSdbJWdvMNfWf6', 'Masum11', 'STUDENT', 0, 1, NULL, NULL, '2026-01-11 01:20:44', NULL),
('MUH2225030M', 'masum@student.nstu.edu.bd', '$2b$10$ybQdc/LD/cKBLbl6JSOMyeQEKFMmHf8UMvMZ1jwiAtbNayLcy7Zmi', 'Masum', 'STUDENT', 0, 1, '2026-01-11 00:48:32', NULL, '2025-12-18 13:38:43', '2026-01-11 00:48:32'),
('MUH2225055M', 'apon2517@student.nstu.edu.bd', '$2b$10$yrIAJJAYERX28ylo8ci6JOaaKALUP7YXgH5kVcbd3YDJky.uvkEnm', 'Apon', 'STUDENT', 0, 1, '2026-01-10 04:05:46', NULL, '2026-01-03 01:16:53', '2026-01-10 04:05:46'),
('MUH2233020M', 'shipon@student.nstu.edu.bd', '$2b$10$Ua2g2CheqaAAoM7DkBMi0ONY/Ul.hFX079NTDswYyElwGnx.lWW7u', 'Shipon Mia', 'STUDENT', 0, 1, '2025-12-26 15:34:34', NULL, '2025-12-26 15:21:41', '2025-12-26 15:34:34'),
('staff-ash', 'staff.ash@nstu.edu.bd', '$2b$10$D2/HC9yEcNiP/cKV8fog.eZVKceJLD72yaS7zjyfRQTeArDd4JeYu', 'Staff - Abdus Salam Hall', 'STAFF', 1, 1, '2026-01-09 20:13:48', NULL, '2026-01-09 19:53:14', '2026-01-09 20:13:48'),
('staff-bkh', 'staff.bkh@nstu.edu.bd', '$2b$10$EK694AX2xQ2bzle1vvNRieoAd8plzH2jJCMr1YocEX8wk/f4L9rAW', 'Staff - Bibi Khadiza Hall', 'STAFF', 1, 1, NULL, NULL, '2026-01-09 19:53:14', NULL),
('staff-jsh', 'staff.jsh@nstu.edu.bd', '$2b$10$Uv3eUjALgkj/qhgBdetl.OGuh7UxVB.tx4VGMRM8kEJHZHAYQX9aO', 'Staff - Shahid Smriti Chatri Hall', 'STAFF', 1, 1, NULL, NULL, '2026-01-09 20:06:54', NULL),
('staff-mal', 'staff.mal@nstu.edu.bd', '$2b$10$J4tJ6nPXmRTySi/IspdJ.u5O4GrY2Gm2CMQ7lsPOq/cD4ri6vz3XS', 'Staff - Maqsudul Hasan Hall', 'STAFF', 1, 1, NULL, NULL, '2026-01-09 19:53:14', NULL),
('staff-muh', 'staff.muh@nstu.edu.bd', '$2b$10$4EHYSAj6nRpgmvBTzJVCh.OA9RNulVwbHYHXIrcPntMP1sUJhAcPK', 'Staff - Abdul Malek Ukil Hall', 'STAFF', 1, 1, '2026-01-10 20:20:30', NULL, '2026-01-09 19:53:14', '2026-01-10 20:20:30'),
('staff-nfh', 'staff.nfh@nstu.edu.bd', '$2b$10$i8bbANhrHT8flm9zgKME4eH93hoBwchE2es.ff5rH/wO3xGosnur2', 'Staff - Nawab Faizunnesa Choudhurani Hall', 'STAFF', 1, 1, NULL, NULL, '2026-01-09 20:06:54', NULL),
('staff-user-uuid', 'staff@nstu.edu.bd', '$2b$10$1GvL8k598hXVtTnwD0.CXO7aFU79vdgck65hHM8saeZVJP2tMYCR.', 'Staff Member', 'STAFF', 1, 1, '2026-01-09 19:41:35', NULL, '2025-11-05 12:00:04', '2026-01-09 19:41:35'),
('student-muh', 'student.muh@student.nstu.edu.bd', '$2b$10$2v31nC9sIKkeGnAMVEOr2eqWlkQJ.Zlz3.R2xtPqc4nnKmZKFnO8O', 'Hasan Mahmud', 'STUDENT', 1, 1, '2025-12-16 11:10:07', NULL, '2025-10-28 20:53:37', '2025-12-16 11:10:07');

-- --------------------------------------------------------

--
-- Table structure for table `waitlist_entries`
--

CREATE TABLE `waitlist_entries` (
  `entryId` char(36) NOT NULL,
  `studentId` char(36) NOT NULL,
  `hallId` char(36) NOT NULL,
  `applicationId` char(36) NOT NULL,
  `position` int(11) NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `addedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `removedAt` datetime DEFAULT NULL,
  `removalReason` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `waitlist_entries`
--

INSERT INTO `waitlist_entries` (`entryId`, `studentId`, `hallId`, `applicationId`, `position`, `score`, `status`, `addedAt`, `removedAt`, `removalReason`, `created_at`, `updated_at`) VALUES
('008ec1ff-d9bf-4242-9aa0-68ca4369266f', 'MUH2225026M', 'hall-muh', '359d48b5-6f06-416e-8352-6dee6bd9f0bf', 33, 55.00, 'INACTIVE', '2026-01-11 01:25:17', '2026-01-11 01:26:35', NULL, '2026-01-11 01:25:17', '2026-01-11 03:52:49'),
('20096d0f-6ffa-45bb-b49e-94be77f0acf8', 'MUH2125020M', 'hall-muh', '8b4a5628-caef-4d29-92a3-ac3234333974', 34, 10.00, 'INACTIVE', '2025-12-26 02:10:48', '2025-12-26 02:11:08', NULL, '2025-12-26 02:10:48', '2026-01-11 03:52:49'),
('2f3690af-0d4a-4302-90b2-0a2618cc07b6', 'MUH2125013M', 'hall-muh', '88844505-03ef-4f9a-add8-c4584eb5eaf8', 35, 35.00, 'INACTIVE', '2025-12-26 00:53:09', '2025-12-26 00:54:05', NULL, '2025-12-26 00:53:09', '2026-01-11 03:52:49'),
('6a813cbf-66e4-47d9-9d3e-cc669bf1e3b9', 'MUH2125020M', 'hall-muh', '3e720e16-d8e5-4ac0-81e3-f44208dad6af', 36, 45.00, 'INACTIVE', '2025-12-26 01:39:55', '2025-12-26 01:40:17', NULL, '2025-12-26 01:39:55', '2026-01-11 03:52:49'),
('925b93aa-2441-4aa3-bcc7-bebff6d1bc92', 'student-muh', 'hall-muh', 'ec42fd37-691c-49ab-be90-fad5207d71c9', 1, 20.00, 'ACTIVE', '2025-12-25 05:00:24', NULL, NULL, '2025-12-25 05:00:24', '2026-01-11 03:52:49'),
('d9717b7a-88a4-4a12-ad80-4492a0f6e1d6', 'MUH2225013M', 'hall-muh', 'a7ec2b54-8c3c-4e34-b284-c5519b663cef', 37, 0.00, 'DELETED', '2025-12-25 05:00:23', '2026-01-11 03:52:49', NULL, '2025-12-25 05:00:23', '2026-01-11 03:52:49'),
('fad8b2d0-a4ba-4ef8-885f-b9a31bd2dbed', 'MUH2233020M', 'hall-muh', 'e59d076e-3e13-4b04-91de-1687a066b62a', 38, 25.00, 'INACTIVE', '2025-12-26 15:23:53', '2025-12-26 15:24:49', NULL, '2025-12-26 15:23:53', '2026-01-11 03:52:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`userId`),
  ADD KEY `idx_admin_hall` (`hallId`),
  ADD KEY `fk_admin_profiles_created_by` (`created_by`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`applicationId`),
  ADD UNIQUE KEY `idx_app_form_student` (`formId`,`studentId`),
  ADD KEY `idx_app_student` (`studentId`),
  ADD KEY `idx_app_status` (`status`),
  ADD KEY `idx_app_submission` (`submissionDate`),
  ADD KEY `idx_app_hall_status` (`hallId`,`status`),
  ADD KEY `fk_applications_form_version` (`formVersionId`),
  ADD KEY `fk_applications_reviewed_by` (`reviewedBy`);

--
-- Indexes for table `application_forms`
--
ALTER TABLE `application_forms`
  ADD PRIMARY KEY (`formId`),
  ADD KEY `idx_form_hall_active` (`hallId`,`isActive`),
  ADD KEY `fk_application_forms_created_by` (`created_by`),
  ADD KEY `fk_application_forms_updated_by` (`updated_by`);

--
-- Indexes for table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`attachmentId`),
  ADD KEY `idx_attachment_entity` (`entityType`,`entityId`),
  ADD KEY `idx_attachment_creator` (`created_by`),
  ADD KEY `idx_attachment_type` (`fileType`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`complaintId`),
  ADD KEY `fk_complaints_user` (`userId`),
  ADD KEY `fk_complaints_hall` (`hallId`),
  ADD KEY `fk_complaints_attachment` (`attachmentId`),
  ADD KEY `fk_complaints_created_by` (`created_by`),
  ADD KEY `fk_complaints_updated_by` (`updated_by`);

--
-- Indexes for table `disciplinary_records`
--
ALTER TABLE `disciplinary_records`
  ADD PRIMARY KEY (`recordId`),
  ADD KEY `idx_disciplinary_student` (`studentId`),
  ADD KEY `idx_disciplinary_hall_student` (`hallId`,`studentId`),
  ADD KEY `idx_disciplinary_date` (`incidentDate`),
  ADD KEY `fk_disciplinary_attachment` (`attachmentId`),
  ADD KEY `fk_disciplinary_created_by` (`created_by`),
  ADD KEY `fk_disciplinary_updated_by` (`updated_by`);

--
-- Indexes for table `exam_controller_profiles`
--
ALTER TABLE `exam_controller_profiles`
  ADD PRIMARY KEY (`userId`);

--
-- Indexes for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD PRIMARY KEY (`resultId`),
  ADD KEY `idx_result_semester` (`semester`),
  ADD KEY `idx_result_visible` (`isVisible`),
  ADD KEY `idx_result_semester_year` (`semester`,`academicYear`),
  ADD KEY `fk_exam_results_attachment` (`attachmentId`),
  ADD KEY `fk_exam_results_created_by` (`created_by`);

--
-- Indexes for table `exam_seat_plans`
--
ALTER TABLE `exam_seat_plans`
  ADD PRIMARY KEY (`planId`),
  ADD KEY `idx_seatplan_date` (`examDate`),
  ADD KEY `idx_seatplan_visible` (`isVisible`),
  ADD KEY `idx_seatplan_semester` (`semester`),
  ADD KEY `fk_exam_seat_plans_attachment` (`attachmentId`),
  ADD KEY `fk_exam_seat_plans_created_by` (`created_by`);

--
-- Indexes for table `field_options`
--
ALTER TABLE `field_options`
  ADD PRIMARY KEY (`optionId`),
  ADD KEY `fk_field_options_field` (`fieldId`),
  ADD KEY `fk_field_options_version` (`versionId`);

--
-- Indexes for table `form_fields`
--
ALTER TABLE `form_fields`
  ADD PRIMARY KEY (`fieldId`),
  ADD KEY `fk_form_fields_form` (`formId`),
  ADD KEY `fk_form_fields_version` (`versionId`);

--
-- Indexes for table `form_responses`
--
ALTER TABLE `form_responses`
  ADD PRIMARY KEY (`responseId`),
  ADD UNIQUE KEY `idx_response_application` (`applicationId`);

--
-- Indexes for table `form_response_values`
--
ALTER TABLE `form_response_values`
  ADD PRIMARY KEY (`responseId`,`fieldId`),
  ADD KEY `idx_response_value_field` (`fieldId`);

--
-- Indexes for table `form_sessions`
--
ALTER TABLE `form_sessions`
  ADD PRIMARY KEY (`formSessionId`),
  ADD KEY `fk_form_sessions_form` (`formId`);

--
-- Indexes for table `form_versions`
--
ALTER TABLE `form_versions`
  ADD PRIMARY KEY (`versionId`),
  ADD UNIQUE KEY `idx_form_version_number` (`formId`,`versionNumber`),
  ADD KEY `fk_form_versions_created_by` (`created_by`);

--
-- Indexes for table `halls`
--
ALTER TABLE `halls`
  ADD PRIMARY KEY (`hallId`),
  ADD UNIQUE KEY `idx_hall_code` (`hallCode`),
  ADD UNIQUE KEY `idx_hall_name` (`hallName`),
  ADD KEY `idx_hall_gender` (`gender`),
  ADD KEY `idx_hall_status` (`status`);

--
-- Indexes for table `interviews`
--
ALTER TABLE `interviews`
  ADD PRIMARY KEY (`interviewId`),
  ADD UNIQUE KEY `u_app` (`applicationId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notificationId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`paymentId`),
  ADD KEY `fk_payments_student` (`studentId`);

--
-- Indexes for table `renewals`
--
ALTER TABLE `renewals`
  ADD PRIMARY KEY (`renewalId`),
  ADD UNIQUE KEY `idx_renewal_student_year` (`studentId`,`academicYear`),
  ADD KEY `idx_renewal_status` (`status`),
  ADD KEY `idx_renewal_allocation` (`allocationId`),
  ADD KEY `fk_renewals_reviewed_by` (`reviewedBy`),
  ADD KEY `fk_renewals_attachment` (`attachmentId`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`roomId`),
  ADD UNIQUE KEY `idx_room_hall_number` (`hallId`,`roomNumber`),
  ADD KEY `idx_room_status` (`status`),
  ADD KEY `idx_room_hall_status` (`hallId`,`status`);

--
-- Indexes for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  ADD PRIMARY KEY (`userId`),
  ADD KEY `idx_staff_hall` (`hallId`),
  ADD KEY `fk_staff_profiles_created_by` (`created_by`);

--
-- Indexes for table `student_allocations`
--
ALTER TABLE `student_allocations`
  ADD PRIMARY KEY (`allocationId`),
  ADD KEY `idx_allocation_student` (`studentId`),
  ADD KEY `idx_allocation_room` (`roomId`),
  ADD KEY `idx_allocation_status` (`status`),
  ADD KEY `fk_allocations_application` (`applicationId`),
  ADD KEY `fk_allocations_payment` (`paymentId`),
  ADD KEY `fk_allocations_created_by` (`created_by`),
  ADD KEY `fk_allocations_updated_by` (`updated_by`);

--
-- Indexes for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `idx_student_university_id` (`universityId`),
  ADD KEY `idx_student_hall` (`hallId`),
  ADD KEY `idx_student_phone` (`phone`),
  ADD KEY `idx_student_profiles_studentIdCardUrl` (`studentIdCardUrl`),
  ADD KEY `idx_student_profiles_programLevel` (`programLevel`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_active` (`isActive`);

--
-- Indexes for table `waitlist_entries`
--
ALTER TABLE `waitlist_entries`
  ADD PRIMARY KEY (`entryId`),
  ADD UNIQUE KEY `idx_waitlist_hall_position` (`hallId`,`position`),
  ADD KEY `idx_waitlist_student` (`studentId`),
  ADD KEY `idx_waitlist_status` (`status`),
  ADD KEY `fk_waitlist_application` (`applicationId`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `fk_admin_profiles_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_admin_profiles_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_admin_profiles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `fk_applications_form` FOREIGN KEY (`formId`) REFERENCES `application_forms` (`formId`),
  ADD CONSTRAINT `fk_applications_form_version` FOREIGN KEY (`formVersionId`) REFERENCES `form_versions` (`versionId`),
  ADD CONSTRAINT `fk_applications_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`),
  ADD CONSTRAINT `fk_applications_reviewed_by` FOREIGN KEY (`reviewedBy`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_applications_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`userId`);

--
-- Constraints for table `application_forms`
--
ALTER TABLE `application_forms`
  ADD CONSTRAINT `fk_application_forms_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_application_forms_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`),
  ADD CONSTRAINT `fk_application_forms_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`userId`);

--
-- Constraints for table `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `fk_attachments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`);

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `fk_complaints_attachment` FOREIGN KEY (`attachmentId`) REFERENCES `attachments` (`attachmentId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_complaints_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_complaints_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_complaints_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_complaints_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`);

--
-- Constraints for table `disciplinary_records`
--
ALTER TABLE `disciplinary_records`
  ADD CONSTRAINT `fk_disciplinary_attachment` FOREIGN KEY (`attachmentId`) REFERENCES `attachments` (`attachmentId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_disciplinary_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_disciplinary_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_disciplinary_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_disciplinary_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`userId`);

--
-- Constraints for table `exam_controller_profiles`
--
ALTER TABLE `exam_controller_profiles`
  ADD CONSTRAINT `fk_exam_controller_profiles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD CONSTRAINT `fk_exam_results_attachment` FOREIGN KEY (`attachmentId`) REFERENCES `attachments` (`attachmentId`),
  ADD CONSTRAINT `fk_exam_results_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`);

--
-- Constraints for table `exam_seat_plans`
--
ALTER TABLE `exam_seat_plans`
  ADD CONSTRAINT `fk_exam_seat_plans_attachment` FOREIGN KEY (`attachmentId`) REFERENCES `attachments` (`attachmentId`),
  ADD CONSTRAINT `fk_exam_seat_plans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`);

--
-- Constraints for table `field_options`
--
ALTER TABLE `field_options`
  ADD CONSTRAINT `fk_field_options_field` FOREIGN KEY (`fieldId`) REFERENCES `form_fields` (`fieldId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_field_options_version` FOREIGN KEY (`versionId`) REFERENCES `form_versions` (`versionId`) ON DELETE CASCADE;

--
-- Constraints for table `form_fields`
--
ALTER TABLE `form_fields`
  ADD CONSTRAINT `fk_form_fields_form` FOREIGN KEY (`formId`) REFERENCES `application_forms` (`formId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_form_fields_version` FOREIGN KEY (`versionId`) REFERENCES `form_versions` (`versionId`) ON DELETE CASCADE;

--
-- Constraints for table `form_responses`
--
ALTER TABLE `form_responses`
  ADD CONSTRAINT `fk_form_responses_application` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`applicationId`) ON DELETE CASCADE;

--
-- Constraints for table `form_response_values`
--
ALTER TABLE `form_response_values`
  ADD CONSTRAINT `fk_response_values_field` FOREIGN KEY (`fieldId`) REFERENCES `form_fields` (`fieldId`),
  ADD CONSTRAINT `fk_response_values_response` FOREIGN KEY (`responseId`) REFERENCES `form_responses` (`responseId`) ON DELETE CASCADE;

--
-- Constraints for table `form_sessions`
--
ALTER TABLE `form_sessions`
  ADD CONSTRAINT `fk_form_sessions_form` FOREIGN KEY (`formId`) REFERENCES `application_forms` (`formId`) ON DELETE CASCADE;

--
-- Constraints for table `form_versions`
--
ALTER TABLE `form_versions`
  ADD CONSTRAINT `fk_form_versions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_form_versions_form` FOREIGN KEY (`formId`) REFERENCES `application_forms` (`formId`) ON DELETE CASCADE;

--
-- Constraints for table `interviews`
--
ALTER TABLE `interviews`
  ADD CONSTRAINT `fk_interview_app` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`applicationId`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`userId`);

--
-- Constraints for table `renewals`
--
ALTER TABLE `renewals`
  ADD CONSTRAINT `fk_renewals_allocation` FOREIGN KEY (`allocationId`) REFERENCES `student_allocations` (`allocationId`),
  ADD CONSTRAINT `fk_renewals_attachment` FOREIGN KEY (`attachmentId`) REFERENCES `attachments` (`attachmentId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_renewals_reviewed_by` FOREIGN KEY (`reviewedBy`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_renewals_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`userId`);

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `fk_rooms_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`) ON DELETE CASCADE;

--
-- Constraints for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  ADD CONSTRAINT `fk_staff_profiles_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_staff_profiles_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_staff_profiles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `student_allocations`
--
ALTER TABLE `student_allocations`
  ADD CONSTRAINT `fk_allocations_application` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`applicationId`),
  ADD CONSTRAINT `fk_allocations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_allocations_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`paymentId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_allocations_room` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`),
  ADD CONSTRAINT `fk_allocations_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `fk_allocations_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`userId`);

--
-- Constraints for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD CONSTRAINT `fk_student_profiles_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_student_profiles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `waitlist_entries`
--
ALTER TABLE `waitlist_entries`
  ADD CONSTRAINT `fk_waitlist_application` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`applicationId`),
  ADD CONSTRAINT `fk_waitlist_hall` FOREIGN KEY (`hallId`) REFERENCES `halls` (`hallId`),
  ADD CONSTRAINT `fk_waitlist_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`userId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
