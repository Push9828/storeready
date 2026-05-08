import { Command } from '@oclif/core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { StoreReadyConfig } from '../types.js';
import { writeStoreReadyConfig } from '../utils/config.js';

export default class Init extends Command {
  static description = 'Interactive setup for storeready. Runs once per project.';

  async run(): Promise<void> {
    console.log();
    console.log(`  ${chalk.bold('✦ storeready — App Store Submission Checker')}`);
    console.log(`  Let's set up your project. This takes 2 minutes.`);
    console.log();

    type Answers = {
      loginType: 'email' | 'phone';
      email?: string;
      password?: string;
      phone?: string;
      otpNote?: string;
      appReviewNotes: string;
      privacyPolicyUrl: string;
      supportUrl: string;
      screenshotsPath: string;
    };

    const answers = await inquirer.prompt<Answers>([
      {
        type: 'list',
        name: 'loginType',
        message: 'How does the demo account log in?',
        choices: [
          { name: 'Email + Password', value: 'email' },
          { name: 'Phone number + OTP', value: 'phone' },
        ],
      },
      {
        type: 'input',
        name: 'email',
        message: 'Demo account email (for Apple reviewer):',
        validate: (val: string) => val.trim().length > 0 || 'Email is required',
        when: (ans: { loginType: string }) => ans.loginType === 'email',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Demo account password (or enter $ENV_VAR_NAME to use an env variable):',
        mask: '*',
        validate: (val: string) => val.trim().length > 0 || 'Password is required',
        when: (ans: { loginType: string }) => ans.loginType === 'email',
      },
      {
        type: 'input',
        name: 'phone',
        message: 'Demo account phone number (e.g. +14155550123):',
        validate: (val: string) => val.trim().length > 0 || 'Phone number is required',
        when: (ans: { loginType: string }) => ans.loginType === 'phone',
      },
      {
        type: 'input',
        name: 'otpNote',
        message: 'OTP note for Apple reviewer (explain how they can receive/bypass OTP):',
        default: 'Use OTP code sent to the demo phone number. Test SIM is managed by our QA team — contact us via App Review notes if needed.',
        when: (ans: { loginType: string }) => ans.loginType === 'phone',
      },
      {
        type: 'input',
        name: 'appReviewNotes',
        message: 'App Review notes (explain any special setup):',
        default: '',
      },
      {
        type: 'input',
        name: 'privacyPolicyUrl',
        message: 'Privacy policy URL:',
        validate: (val: string) =>
          /^https?:\/\/.+\..+/i.test(val.trim()) ||
          'Enter a valid URL (e.g. https://yourapp.com/privacy)',
      },
      {
        type: 'input',
        name: 'supportUrl',
        message: 'Support URL:',
        validate: (val: string) =>
          /^https?:\/\/.+\..+/i.test(val.trim()) ||
          'Enter a valid URL (e.g. https://yourapp.com/support)',
      },
      {
        type: 'input',
        name: 'screenshotsPath',
        message: 'Path to screenshots folder (relative to project root):',
        default: './assets/screenshots',
      },
    ]);

    const demoAccount: StoreReadyConfig['demoAccount'] =
      answers.loginType === 'phone'
        ? { loginType: 'phone', phone: answers.phone!.trim(), otpNote: answers.otpNote!.trim() }
        : { loginType: 'email', email: answers.email!.trim(), password: answers.password!.trim() };

    const config: StoreReadyConfig = {
      demoAccount,
      appReviewNotes: answers.appReviewNotes.trim(),
      privacyPolicyUrl: answers.privacyPolicyUrl.trim(),
      supportUrl: answers.supportUrl.trim(),
      screenshotsPath: answers.screenshotsPath.trim(),
    };

    await writeStoreReadyConfig(config);

    console.log();
    console.log(`  ${chalk.green('✅')}  .storeready created. Commit this file to your repo.`);
    console.log(`  Run ${chalk.cyan('npx storeready check')} before every submission.`);
    console.log();
  }
}
