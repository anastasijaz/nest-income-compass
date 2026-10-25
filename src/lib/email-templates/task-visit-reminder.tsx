import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';

interface Props {
  name?: string;
  taskTitle?: string;
  propertyName?: string;
  city?: string;
  visitStart?: string;
  visitEnd?: string;
}

function TaskVisitReminder({ name, taskTitle = 'Your assigned task', propertyName = 'Your property', city, visitStart, visitEnd }: Props) {
  return <Html lang="en"><Head /><Preview>{taskTitle} at {propertyName} during your visit</Preview>
    <Body style={body}><Container style={container}>
      <Text style={brand}>Rentwise</Text>
      <Heading style={heading}>A task for your visit</Heading>
      <Text style={text}>{name ? `Hi ${name},` : 'Hello,'}</Text>
      <Text style={text}>You have an unfinished task assigned to you at {propertyName}{city ? ` in ${city}` : ''} during your planned stay.</Text>
      <Section style={details}><Heading as="h2" style={task}>{taskTitle}</Heading>
        <Text style={text}>{propertyName}{city ? ` · ${city}` : ''}</Text>
        {visitStart && <Text style={text}>Planned visit: {visitStart}{visitEnd && visitEnd !== visitStart ? ` – ${visitEnd}` : ''}</Text>}
      </Section>
    </Container></Body>
  </Html>;
}

export const template = {
  component: TaskVisitReminder,
  subject: 'Your assigned property task during your visit',
  displayName: 'Task reminder during a planned visit',
  previewData: { name: 'Alex', taskTitle: 'Check the heating', propertyName: 'City apartment', city: 'Belgrade', visitStart: '25 October 2026', visitEnd: '28 October 2026' },
} satisfies TemplateEntry;

const body = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#302f2c' };
const container = { maxWidth: '560px', padding: '32px 24px' };
const brand = { fontSize: '16px', fontWeight: '700' };
const heading = { fontSize: '26px', fontWeight: '600' };
const task = { fontSize: '19px', fontWeight: '600' };
const text = { fontSize: '16px', lineHeight: '1.6' };
const details = { borderTop: '1px solid #e6e5e2', marginTop: '24px', paddingTop: '12px' };