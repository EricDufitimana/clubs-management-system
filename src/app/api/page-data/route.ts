import { NextResponse } from 'next/server'

const avatarList = [
  {
    image: '/images/home/avatar_1.jpg',
    title: 'Sarah Johnson',
  },
  {
    image: '/images/home/avatar_2.jpg',
    title: 'Olivia Miller',
  },
  {
    image: '/images/home/avatar_3.jpg',
    title: 'Sophia Roberts',
  },
  {
    image: '/images/home/avatar_4.jpg',
    title: 'Isabella Clark',
  },
]

const brandList = [
  {
    image: '/images/home/brand/brand-icon-1.svg',
    darkImg: '/images/home/brand/brand-darkicon-1.svg',
    title: 'Adobe',
  },
  {
    image: '/images/home/brand/brand-icon-2.svg',
    darkImg: '/images/home/brand/brand-darkicon-2.svg',
    title: 'Figma',
  },
  {
    image: '/images/home/brand/brand-icon-3.svg',
    darkImg: '/images/home/brand/brand-darkicon-3.svg',
    title: 'Shopify',
  },
  {
    image: '/images/home/brand/brand-icon-4.svg',
    darkImg: '/images/home/brand/brand-darkicon-4.svg',
    title: 'Dribble',
  },
  {
    image: '/images/home/brand/brand-icon-5.svg',
    darkImg: '/images/home/brand/brand-darkicon-5.svg',
    title: 'Webflow',
  },
]

const innovationList = [
  {
    image: '/images/home/innovation/brand.svg',
    title: 'Club\nManagement',
    bg_color: 'bg-purple/20',
    txt_color: 'text-purple',
    description: 'Managing a club shouldn’t feel like juggling fire. With our platform, you can create clubs, assign leaders, and keep everything organized — all in one place. Say goodbye to chaos, missing sheets, and endless emails, and hello to smooth, stress-free management that actually works.'
  },
  {
    image: '/images/home/innovation/digitalmarketing.svg',
    title: 'Attendance\nTracking',
    bg_color: 'bg-blue/20',
    txt_color: 'text-blue',
    description: 'Paper sheets? Lost lists? Big nope. Track who’s in and who’s out with just a few taps. Fast, simple, and totally stress-free — so you can spend less time chasing signatures and more time actually running your club.'
  },
  {
    image: '/images/home/innovation/uiux.svg',
    title: 'Reports \n& Insights',
    bg_color: 'bg-orange/20',
    txt_color: 'text-orange',
    description: 'Stop guessing and start knowing. Get clear, easy-to-read stats on attendance, club activity, and engagement. Our reports show what’s working, what’s not, and where you can level up — all without digging through spreadsheets.'
  },
  {
    image: '/images/home/innovation/analitics.svg',
    title: 'Web-Based \n& Secure',
    bg_color: 'bg-green/20',
    txt_color: 'text-green',
    description: 'Access your clubs anytime, anywhere, without losing sleep over security. Everything’s online, safe, and reliable — no more worrying about lost papers, messy files, or someone “accidentally” deleting data.'
  },
 
]

const onlinePresenceList = [
  {
    image: '/images/home/onlinePresence/online_img_1.jpg',
    title: 'FlowBank',
    tag: ['UX Research', 'Interface Design'],
    link: 'https://www.wrappixel.com/',
  },
  {
    image: '/images/home/onlinePresence/online_img_2.jpg',
    title: 'Academy.co',
    tag: ['Product Design', 'Interaction Design'],
    link: 'https://www.wrappixel.com/',
  },
  {
    image: '/images/home/onlinePresence/online_img_3.jpg',
    title: 'Genome',
    tag: ['Brand identity design', 'UX Research'],
    link: 'https://www.wrappixel.com/',
  },
  {
    image: '/images/home/onlinePresence/online_img_4.jpg',
    title: 'Hotto',
    tag: ['Visual Storytelling', 'Web & Mobile Design'],
    link: 'https://www.wrappixel.com/',
  },
]

const creativeMindList = [
  {
    image: '/images/home/creative/creative_img_1.png',
    name: 'Logan Dang',
    position: 'WordPress Developer',
    twitterLink: 'https://x.com/',
    linkedinLink: 'https://in.linkedin.com/',
  },
  {
    image: '/images/home/creative/creative_img_2.png',
    name: 'Ana Belić',
    position: 'Social Media Specialist',
    twitterLink: 'https://x.com/',
    linkedinLink: 'https://in.linkedin.com/',
  },
  {
    image: '/images/home/creative/creative_img_3.png',
    name: 'Brian Hanley',
    position: 'Product Designer',
    twitterLink: 'https://x.com/',
    linkedinLink: 'https://in.linkedin.com/',
  },
  {
    image: '/images/home/creative/creative_img_4.png',
    name: 'Darko Stanković',
    position: 'UI Designer',
    twitterLink: 'https://x.com/',
    linkedinLink: 'https://in.linkedin.com/',
  },
]

const WebResultTagList = [
  {
    image: '/images/home/result/creativity.svg',
    name: 'Creativity',
    bg_color: 'bg-purple/20',
    txt_color: 'text-purple',
  },
  {
    image: '/images/home/result/innovation.svg',
    name: 'Innovation',
    bg_color: 'bg-blue/20',
    txt_color: 'text-blue',
  },
  {
    image: '/images/home/result/strategy.svg',
    name: 'Strategy',
    bg_color: 'bg-orange/20',
    txt_color: 'text-orange',
  },
]

const individualsTeamsPlanList = [
  {
    plan_bg_color: 'bg-pale-yellow',
    text_color: 'text-dark_black',
    descp_color: 'dark_black/60',
    border_color: 'border-dark_black/10',
    plan_name: 'Starter',
    plan_descp: 'Perfect for individual clubs and small teams getting started',
    plan_price: '$25',
    icon_img: '/images/home/startupPlan/white_tick.svg',
    plan_feature: [
      'Up to 50 members',
      'Basic attendance tracking',
      'Club management tools',
      'Email support',
      'Mobile app access',
      'Monthly reports',
    ],
  },
  {
    plan_bg_color: 'bg-purple_blue',
    text_color: 'text-white',
    descp_color: 'white/60',
    border_color: 'border-white/10',
    plan_name: 'Pro',
    plan_descp: 'Ideal for growing teams and multiple clubs',
    plan_price: '$50',
    icon_img: '/images/home/startupPlan/black_tick.svg',
    plan_feature: [
      'Up to 200 members',
      'Advanced analytics',
      'Custom branding',
      'Priority support',
      'API access',
      'Advanced reporting',
    ],
  },
]

const schoolsPlanList = [
  {
    plan_bg_color: 'bg-dark_black',
    text_color: 'text-white',
    descp_color: 'white/60',
    border_color: 'border-white/10',
    plan_name: 'School Basic',
    plan_descp: 'Perfect for small schools with multiple clubs',
    plan_price: '$200',
    icon_img: '/images/home/startupPlan/white_tick.svg',
    plan_feature: [
      'Unlimited clubs',
      'Up to 500 students',
      'School-wide dashboard',
      'Admin controls',
      'Bulk member management',
      'Email support',
    ],
  },
  {
    plan_bg_color: 'bg-orange',
    text_color: 'text-dark_black',
    descp_color: 'dark_black/60',
    border_color: 'border-dark_black/10',
    plan_name: 'School Enterprise',
    plan_descp: 'Complete solution for large schools and districts',
    plan_price: '$500',
    icon_img: '/images/home/startupPlan/white_tick.svg',
    plan_feature: [
      'Unlimited everything',
      'Multi-school management',
      'Custom integrations',
      'Dedicated support',
      'Training & onboarding',
      'Advanced security',
    ],
  },
]

const startupPlanList = individualsTeamsPlanList // Keep for backward compatibility

const faqList = [
  {
    faq_que: 'How do I track attendance?',
    faq_ans:
      'Super easy. Tap, click, done. No more lost papers, random signatures, or chasing students around the hallway. Your life just got way simpler.',
  },
  {
    faq_que: 'Can I manage multiple clubs at once?',
    faq_ans:
      'Heck yes. One dashboard to rule them all. Add clubs, assign leaders, track activity — all without needing 12 spreadsheets and 3 whiteboards.',
  },
  {
    faq_que: 'Is the system secure?',
    faq_ans:
      'Totally. Your data is locked down tighter than your principal\'s office. Safe, private, and fully online so you can access it anywhere (even from your bed).',
  },
  {
    faq_que: 'Can I see reports and insights?',
    faq_ans:
      'Absolutely. We turn attendance and engagement into actual numbers you can read without crying. Charts, graphs, stats — all the good stuff, minus the headache.',
  },
  {
    faq_que: 'Do students see everything?',
    faq_ans:
      'Nope. Only what you want them to see. No accidental spoilers or "who\'s absent" drama. You\'re in control.',
  },
  {
    faq_que: 'How quickly can I get started?',
    faq_ans:
      'Fast. Like, "set up your first club before lunch" fast. Seriously, it\'s that simple.',
  },
  {
    faq_que: 'What if I need help?',
    faq_ans:
      'We got your back. Questions, glitches, or existential club crises — our support team is here, ready to rescue you from paper chaos.',
  },
]

const achievementsList = [
  {
    icon: '/images/home/achievement/framer_award.svg',
    dark_icon: '/images/home/achievement/dark_framer_award.svg',
    sub_title: 'Framer Awards',
    title:
      'Celebrated for cutting-edge interaction design and seamless user experiences.',
    year: '2024',
    url: 'https://www.framer.com/@wrap-pixel/',
  },
  {
    icon: '/images/home/achievement/dribble_award.svg',
    dark_icon: '/images/home/achievement/dribble_award.svg',
    sub_title: 'Dribbble Awards',
    title: 'Recognized for creative excellence and innovative design solutions',
    year: '2023',
    url: 'https://dribbble.com/wrappixel',
  },
  {
    icon: '/images/home/achievement/awward_award.svg',
    dark_icon: '/images/home/achievement/dark_awward_award.svg',
    sub_title: 'awwwards Awards',
    title:
      'Honored with the Best Website Design for creativity, usability, and innovation.',
    year: '2022',
    url: 'https://www.framer.com/@wrap-pixel/',
  },
]


export const GET = async () => {
  return NextResponse.json({
    avatarList,
    brandList,
    innovationList,
    onlinePresenceList,
    creativeMindList,
    WebResultTagList,
    startupPlanList,
    individualsTeamsPlanList,
    schoolsPlanList,
    faqList,
    achievementsList,
  });
};
