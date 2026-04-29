import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Muslim Nikah',
  description: 'Read the Terms and Conditions for using the Muslim Nikah matrimonial platform.',
};

type ParaBlock = { type: 'para'; text: string };
type SubBlock  = { type: 'sub';  heading: string; text: string };
type ListBlock = { type: 'list'; items: string[] };
type ContentBlock = ParaBlock | SubBlock | ListBlock;

type Section = {
  id: string;
  number: string;
  title: string;
  content: ContentBlock[];
};

const sections: Section[] = [
  {
    id: 'acceptance',
    number: '1',
    title: 'Acceptance of Terms of Use',
    content: [
      {
        type: 'para',
        text: 'By accessing or using the Muslim Nikah platform, you agree to be bound by these Terms of Use and our Privacy Statement. If you do not agree with any part of these terms, you must not use our services.',
      },
      {
        type: 'para',
        text: 'Continuing to use the platform after any changes to these Terms constitutes your acceptance of those changes. You are responsible for reviewing these Terms regularly to stay informed of any updates.',
      },
      {
        type: 'para',
        text: 'Muslim Nikah reserves the right to modify these Terms at any time without prior notice. Changes take effect immediately upon publication on the platform.',
      },
    ],
  },
  {
    id: 'membership',
    number: '2',
    title: 'Membership',
    content: [
      {
        type: 'sub',
        heading: '2.1 Eligibility',
        text: 'To register and use our services, you must be 18 years of age or older. By creating an account, you confirm that you meet this age requirement.',
      },
      {
        type: 'sub',
        heading: '2.2 Formation of Contract',
        text: 'Completing the registration process creates a binding contract between you and Muslim Nikah under these Terms. Any subscription upgrade you select is binding at the price displayed at the time of purchase.',
      },
      {
        type: 'sub',
        heading: '2.3 Subscription Fees',
        text: 'Subscription fees are subject to change and may vary by jurisdiction. Any changes to fees will be communicated in advance. Continued use of the service after a fee change constitutes acceptance of the new pricing.',
      },
      {
        type: 'sub',
        heading: '2.5 Account Security',
        text: 'You are solely responsible for maintaining the confidentiality of your password and account credentials. You agree to notify us immediately of any unauthorised use of your account. Muslim Nikah shall not be liable for any loss resulting from unauthorised use of your account.',
      },
      {
        type: 'sub',
        heading: '2.6 Identity Verification',
        text: 'Muslim Nikah may request identity verification (such as a National Identity Card) for members, parents, or the bride/groom to ensure the authenticity and safety of our community.',
      },
      {
        type: 'sub',
        heading: '2.7 Nature of the Service',
        text: 'Muslim Nikah is a platform that facilitates contact between individuals seeking marriage (Nikah). We are not a matchmaking agency, marriage broker, or counselling service. We do not guarantee any matrimonial outcome.',
      },
      {
        type: 'sub',
        heading: '2.9 Accuracy of Information',
        text: 'You warrant that all information, photographs, and content you provide are accurate, truthful, and not harmful, offensive, or in violation of any applicable law. Providing false information is grounds for immediate account termination.',
      },
    ],
  },
  {
    id: 'information',
    number: '3',
    title: 'Information and Interaction',
    content: [
      {
        type: 'sub',
        heading: '3.1 Member Interactions',
        text: 'You are solely responsible for all interactions with other members of the platform. Muslim Nikah is not responsible for the conduct of any member, whether online or offline.',
      },
      {
        type: 'sub',
        heading: '3.2 Profile Monitoring',
        text: 'Muslim Nikah reserves the right to monitor profiles, messages, and activity on the platform for compliance with these Terms, security purposes, and to maintain the quality of the community.',
      },
      {
        type: 'sub',
        heading: '3.5 Field Restrictions',
        text: 'Certain profile fields cannot be altered by the user once set. These include: Age, Civil Status, Height, Country/City of Origin, Gender, and Date of Birth. Amendments to these fields must be submitted as an edit request to an administrator.',
      },
      {
        type: 'sub',
        heading: '3.7 Communication Options',
        text: 'The platform provides multiple communication options including Direct Messaging, WhatsApp contact, and Direct Calling, subject to subscription level and mutual consent between members.',
      },
      {
        type: 'sub',
        heading: '3.9 Contact Number Access',
        text: 'Access to another member\'s contact number depends on the platform\'s matching criteria and user preferences, including factors such as age range and civil status compatibility.',
      },
    ],
  },
  {
    id: 'cancellation',
    number: '4',
    title: 'Membership Cancellation & Policies',
    content: [
      {
        type: 'sub',
        heading: '4.1 Marriage Confirmation',
        text: 'Upon confirmation of a successful Nikah or engagement arranged through the platform, your membership will be permanently deleted. Any remaining subscription time will be forfeited and is non-transferable.',
      },
      {
        type: 'sub',
        heading: '4.6 Profile Edits',
        text: 'Requests to edit restricted profile fields must be submitted through an administrator. Approved edits may take up to 48 hours to be reflected on your profile.',
      },
      {
        type: 'sub',
        heading: '4.7 Refund Policy',
        text: 'Refund requests must be made prior to the approval of your membership by our team. Once a membership has been approved and activated, it is non-refundable under any circumstances.',
      },
      {
        type: 'sub',
        heading: '4.9 Refund Timeline',
        text: 'Where a refund is approved, processing times are as follows: credit/debit card payments within 10 business days, and bank transfers within 14 business days.',
      },
    ],
  },
  {
    id: 'termination',
    number: '5',
    title: 'Special Termination Causes',
    content: [
      {
        type: 'para',
        text: 'Muslim Nikah reserves the right to immediately suspend or terminate your account, without notice or refund, under the following circumstances:',
      },
      {
        type: 'list',
        items: [
          'Confirmation of a fixed marriage or engagement.',
          'Submission of misinformation, false identity, or fraudulent content.',
          'Sharing your account credentials with another person.',
          'Persistent or serious violation of these Terms of Use.',
          'Conduct that is deemed harmful, offensive, or disruptive to other members or the platform.',
        ],
      },
    ],
  },
  {
    id: 'amendments',
    number: '6',
    title: 'Amendments to Terms',
    content: [
      {
        type: 'para',
        text: 'Muslim Nikah may revise these Terms of Use at any time. The updated Terms will be posted on this page with a revised effective date. Your continued use of the platform following any changes constitutes your acceptance of the revised Terms.',
      },
    ],
  },
  {
    id: 'contact',
    number: '7',
    title: 'Contact Us',
    content: [
      {
        type: 'para',
        text: 'If you have any questions or concerns regarding these Terms and Conditions, please contact us through our Contact page or reach out to our support team directly.',
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F5F7F5] font-poppins">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #085140 0%, #1C3B35 60%, #0d3d2e 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Terms &amp; Conditions</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Terms &amp; Conditions
              </h1>
              <p className="mt-3 text-white/60 text-sm sm:text-base max-w-xl leading-relaxed">
                Please read these terms carefully before using the Muslim Nikah platform. By accessing our services, you agree to be bound by the terms below.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-white/70 font-medium">Effective: January 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 bg-[#F0F4F2] border-b border-gray-100">
                <p className="text-xs font-bold text-[#1C3B35] uppercase tracking-wider">On this page</p>
              </div>
              <nav className="py-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-[#1C3B35] hover:bg-[#F0F4F2] transition-colors group"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#1C3B35]/10 text-[#1C3B35] text-[10px] font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-[#1C3B35] group-hover:text-white transition-colors">
                      {s.number}
                    </span>
                    <span className="leading-snug">{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6"
              >
                {/* Section header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#F0F4F2] to-white">
                  <div className="w-9 h-9 rounded-xl bg-[#1C3B35] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {section.number}
                  </div>
                  <h2 className="text-base font-bold text-[#1C3B35]">{section.title}</h2>
                </div>

                {/* Section body */}
                <div className="px-6 py-5 space-y-4">
                  {section.content.map((block, bi) => {
                    if (block.type === 'para') {
                      return (
                        <p key={bi} className="text-sm text-gray-600 leading-relaxed">
                          {block.text}
                        </p>
                      );
                    }
                    if (block.type === 'sub') {
                      return (
                        <div key={bi} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
                          <p className="text-xs font-bold text-[#1C3B35] mb-1.5">{block.heading}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{block.text}</p>
                        </div>
                      );
                    }
                    if (block.type === 'list') {
                      return (
                        <ul key={bi} className="space-y-2">
                          {block.items.map((item, ii) => (
                            <li key={ii} className="flex items-start gap-3 text-sm text-gray-600">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1C3B35] flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })}
                </div>
              </section>
            ))}

            {/* Footer note */}
            <div className="bg-[#1C3B35] rounded-2xl px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Questions about our Terms?</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  If you have any questions or need clarification, please{' '}
                  <Link href="/contact" className="text-[#DB9D30] hover:underline font-medium">contact our support team</Link>.
                  We&apos;re happy to help.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
