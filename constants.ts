import { Phase, TaskStatus } from './types';

export const PROJECT_DATA: Omit<Phase, 'status'>[] = [
  {
    id: 'phase-1',
    title: 'שלב 1 – התנעה והגדרת יעדים',
    timeline: 'ימים 1–3',
    goals: [
      'לוודא יישור ציפיות מלא.',
      'לאשר אפיון ויזואלי ותכולת הפרויקט.',
    ],
    tasks: [
      { id: '1-1', name: 'פגישת התנעה (Kickoff) עם ירון', status: TaskStatus.Pending, hours: 0 },
      { id: '1-2', name: 'סיכום מטרות על: שיפור יחס המרה, חיסכון בזמן, ניהול לידים עד סגירה', status: TaskStatus.Pending, hours: 0 },
      { id: '1-3', name: 'אימות אפיון השדות והסטטוסים ב־Airtable', status: TaskStatus.Pending, hours: 0 },
      { id: '1-4', name: 'הגדרת הרשאות משתמשים (ירון, איש מכירות)', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'RocketIcon',
  },
  {
    id: 'phase-2',
    title: 'שלב 2 – הקמת בסיס ה־CRM',
    timeline: 'ימים 4–15',
    goals: ['הקמת בסיס הנתונים הראשי והגדרת מבנה העבודה.'],
    tasks: [
      { id: '2-1', name: 'בניית טבלת CRM ב־Airtable עם כלל השדות הנדרשים', status: TaskStatus.Pending, hours: 0 },
      { id: '2-2', name: 'בניית תצוגות (Views): לידים פתוחים, לקוחות סגורים, רימרקטינג, דוחות חודשיים', status: TaskStatus.Pending, hours: 0 },
      { id: '2-3', name: 'חיבור משתמשים והרשאות', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'DatabaseIcon',
  },
  {
    id: 'phase-3',
    title: 'שלב 3 – בניית תהליכי אוטומציה',
    timeline: 'ימים 16–35',
    goals: ['אוטומציה מלאה של קליטת הלידים, פולואפים וסגירה.'],
    tasks: [
      { id: '3-1', name: 'קליטת לידים מכל המקורות (אתר, פייסבוק, וואטסאפ) ב-Make', status: TaskStatus.Pending, hours: 0 },
      { id: '3-2', name: 'שליחת הודעת וואטסאפ מיידית ללקוח (Manychat API)', status: TaskStatus.Pending, hours: 0 },
      { id: '3-3', name: 'התראה לאיש מכירות', status: TaskStatus.Pending, hours: 0 },
      { id: '3-4', name: 'תזכורות Follow-up לאחר 2–3 ימים', status: TaskStatus.Pending, hours: 0 },
      { id: '3-5', name: 'עדכון סטטוס אוטומטי אחרי תשלום', status: TaskStatus.Pending, hours: 0 },
      { id: '3-6', name: 'העברת לידים שלא נסגרו לרשימת רימרקטינג', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'CogIcon',
  },
  {
    id: 'phase-4',
    title: 'שלב 4 – הקמת בוט תקשורת',
    timeline: 'ימים 36–45',
    goals: ['יצירת חוויית לקוח אינטראקטיבית וניהול שיח אוטומטי עם מתעניינים.'],
    tasks: [
        { id: '4-1', name: 'Manychat bot עם שאלות סינון ראשוניות', status: TaskStatus.Pending, hours: 0 },
        { id: '4-2', name: 'הודעות “תודה” ו־“נציג יחזור אליך”', status: TaskStatus.Pending, hours: 0 },
        { id: '4-3', name: 'אוטומציית פולואפים והודעות סגירה', status: TaskStatus.Pending, hours: 0 },
        { id: '4-4', name: 'חיבור מלא ל־Airtable', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'ChatBubbleIcon',
  },
  {
    id: 'phase-5',
    title: 'שלב 5 – אינטגרציות והטמעות',
    timeline: 'ימים 46–55',
    goals: ['חיבור מלא של כלל המערכות.'],
    tasks: [
        { id: '5-1', name: 'Airtable ←→ Make', status: TaskStatus.Pending, hours: 0 },
        { id: '5-2', name: 'Make ←→ Manychat', status: TaskStatus.Pending, hours: 0 },
        { id: '5-3', name: 'Make ←→ Tranzila (לאחר אישור חיבור API)', status: TaskStatus.Pending, hours: 0 },
        { id: '5-4', name: 'Make ←→ Elementor (טפסים באתר)', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'LinkIcon',
  },
  {
    id: 'phase-6',
    title: 'שלב 6 – בדיקות, תיקונים והשקה',
    timeline: 'ימים 56–60',
    goals: [
        'לבדוק שכל הטריגרים והאוטומציות פועלים תקין.',
        'לבצע תיקונים בהתאם למשוב ירון.',
        'להעביר הדרכה קצרה על השימוש במערכת.',
    ],
    tasks: [
        { id: '6-1', name: 'בדיקת תהליכי אוטומציה מקצה לקצה', status: TaskStatus.Pending, hours: 0 },
        { id: '6-2', name: 'סבב תיקונים ושיפורים', status: TaskStatus.Pending, hours: 0 },
        { id: '6-3', name: 'הדרכה והשקה רשמית', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'CheckCircleIcon',
  },
  {
    id: 'phase-7',
    title: 'שלב 7 – דוחות, מדידה ותחזוקה',
    timeline: 'לאחר ההשקה',
    goals: [
        'לוודא שהמערכת מניבה תוצאות מדידות.',
        'לבצע fine-tuning לפי נתונים אמיתיים.',
    ],
    tasks: [
        { id: '7-1', name: 'הפקת דוח ראשון: יחס המרה, מקורות לידים, זמן תגובה', status: TaskStatus.Pending, hours: 0 },
        { id: '7-2', name: 'הצעות לשיפור אוטומציות והודעות', status: TaskStatus.Pending, hours: 0 },
        { id: '7-3', name: 'תחזוקה שוטפת', status: TaskStatus.Pending, hours: 0 },
    ],
    icon: 'ChartBarIcon',
  },
];