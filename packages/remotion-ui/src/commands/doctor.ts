import {
  doctorReportToJson,
  formatDoctorReport,
  runDoctor,
} from "../preflights/preflight-doctor.js";

export type DoctorOptions = {
  cwd?: string;
  json?: boolean;
};

export async function doctorCommand(
  options: DoctorOptions = {},
): Promise<void> {
  const report = await runDoctor(options.cwd ?? process.cwd());

  if (options.json) {
    console.log(doctorReportToJson(report));
  } else {
    console.log(formatDoctorReport(report));
  }

  if (!report.ok) {
    process.exitCode = 1;
  }
}
