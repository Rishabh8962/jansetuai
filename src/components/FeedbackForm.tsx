import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const FeedbackSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  issue_id: z.string().trim().max(50).optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(5, 'Tell us a bit more').max(1000),
});

export default function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issueId, setIssueId] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    const parsed = FeedbackSchema.safeParse({
      name, email, issue_id: issueId, rating, message,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('feedback').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      issue_id: parsed.data.issue_id || null,
      rating: parsed.data.rating,
      message: parsed.data.message,
      user_id: user?.id ?? null,
    });
    setLoading(false);
    if (error) {
      toast.error('Could not send feedback. Please try again.');
      return;
    }
    setSubmitted(true);
    toast.success('Thanks! Your feedback reached the Command Center.');
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 text-center space-y-3"
      >
        <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
        <h3 className="text-xl font-bold">Feedback received</h3>
        <p className="text-sm text-muted-foreground">
          Thank you for helping us improve JanMitra AI. The Command Center has been notified.
        </p>
        <Button variant="outline" onClick={() => {
          setSubmitted(false); setName(''); setEmail(''); setIssueId(''); setRating(0); setMessage('');
        }}>
          Send another
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-bold">Share your feedback</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Help us make JanMitra AI better. Your feedback goes straight to the Command Center.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Your name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Riya Sharma" maxLength={100} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" maxLength={255} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Issue ID (optional)</label>
        <Input value={issueId} onChange={(e) => setIssueId(e.target.value)} placeholder="e.g. C-1234" maxLength={50} />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 ${
                  n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                }`}
              />
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-sm font-mono text-muted-foreground">{rating}/5</span>}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Your feedback</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What worked well? What can we improve?"
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
        <div className="text-[10px] text-right text-muted-foreground mt-1">{message.length}/1000</div>
      </div>

      <Button onClick={submit} disabled={loading} className="w-full gap-2">
        <Send className="w-4 h-4" />
        {loading ? 'Sending…' : 'Send feedback'}
      </Button>
    </div>
  );
}
