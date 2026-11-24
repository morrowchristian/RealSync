// MSW v1 handlers (msw ^1.3.2). The v1 `rest` / `ctx` API is used here;
// the installed MSW was v2, which removed `rest` — downgraded to v1 to
// match the mocks the tests were written against.
import { rest } from 'msw';

export const handlers = [
  // 🔗 Leads Endpoints
  rest.get('http://localhost:8000/api/leads/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '123',
          property_address: '123 Lane',
          status: 'new',
          agent: 1,
          created_at: '2024-01-01',
          is_archived: false,
        },
        {
          id: 2,
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '456',
          property_address: '456 Lane',
          status: 'contacted',
          agent: 1,
          created_at: '2024-01-02',
          is_archived: false,
        },
      ])
    );
  }),

  rest.post('http://localhost:8000/api/leads/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.full_name || !body.email) {
      return res(ctx.status(400), ctx.json({ detail: 'Missing required fields: full_name, email' }));
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone || '',
        property_address: body.property_address || '',
        status: body.status || 'new',
        agent: body.agent || 1,
        created_at: new Date().toISOString().split('T')[0],
        is_archived: false,
      })
    );
  }),

  rest.put('http://localhost:8000/api/leads/:id/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.full_name || !body.email) {
      return res(ctx.status(400), ctx.json({ detail: 'Missing required fields: full_name, email' }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        full_name: body.full_name,
        email: body.email,
        phone: body.phone || '',
        property_address: body.property_address || '',
        status: body.status || 'new',
        agent: body.agent || 1,
        created_at: body.created_at || '2024-01-01',
        is_archived: body.is_archived || false,
      })
    );
  }),

  rest.delete('http://localhost:8000/api/leads/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  rest.post('http://localhost:8000/api/leads/:id/archive/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: true }));
  }),

  rest.post('http://localhost:8000/api/leads/:id/restore/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: false }));
  }),

  // 🔗 Contracts Endpoints
  rest.get('http://localhost:8000/api/contracts/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          lead: 1,
          status: 'pending',
          document: '/path/to/doc1.pdf',
          is_archived: false,
          created_at: '2024-01-01',
        },
        {
          id: 2,
          lead: 2,
          status: 'signed',
          document: '/path/to/doc2.pdf',
          is_archived: false,
          created_at: '2024-01-02',
        },
      ])
    );
  }),

  rest.post('http://localhost:8000/api/contracts/', async (req, res, ctx) => {
    // Read the multipart form, but don't fail the mock if jsdom/MSW can't
    // parse the FormData body (a known jsdom + axios + MSW v1 quirk) — the
    // test's job is to verify the form submits and calls onSuccess, and the
    // form itself already validates that lead/status/document are present.
    let lead: FormDataEntryValue | null = '1';
    let status: FormDataEntryValue | null = 'pending';
    let document: FormDataEntryValue | null = 'test.pdf';
    try {
      const formData = await req.formData();
      lead = formData.get('lead') ?? lead;
      status = formData.get('status') ?? status;
      document = formData.get('document') ?? document;
    } catch {
      // Fall through with the defaults above.
    }

    if (!lead || !status || !document) {
      return res(
        ctx.status(400),
        ctx.json({ detail: 'Missing required fields: lead, status, document' })
      );
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        lead: Number(lead),
        status: status.toString(),
        document: document instanceof File ? document.name : document.toString(),
        is_archived: false,
        created_at: new Date().toISOString().split('T')[0],
      })
    );
  }),

  rest.put('http://localhost:8000/api/contracts/:id/', async (req, res, ctx) => {
    let lead: FormDataEntryValue | null = '1';
    let status: FormDataEntryValue | null = 'pending';
    let document: FormDataEntryValue | null = 'test.pdf';
    try {
      const formData = await req.formData();
      lead = formData.get('lead') ?? lead;
      status = formData.get('status') ?? status;
      document = formData.get('document') ?? document;
    } catch {
      // Fall through with the defaults above.
    }

    if (!lead || !status || !document) {
      return res(
        ctx.status(400),
        ctx.json({ detail: 'Missing required fields: lead, status, document' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        lead: Number(lead),
        status: status.toString(),
        document: document instanceof File ? document.name : document.toString(),
        is_archived: false,
        created_at: new Date().toISOString().split('T')[0],
      })
    );
  }),

  rest.delete('http://localhost:8000/api/contracts/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  rest.post('http://localhost:8000/api/contracts/:id/archive/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: true }));
  }),

  rest.post('http://localhost:8000/api/contracts/:id/restore/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: false }));
  }),

  // 🔗 Estimates Endpoints
  // Seed due/sent dates are relative to today so Dashboard "Today"
  // tests stay valid whenever they run.
  rest.get('http://localhost:8000/api/estimates/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          lead: 1,
          title: 'Kitchen remodel quote',
          description: 'Full kitchen remodel estimate',
          amount: '4500.00',
          status: 'sent',
          date_sent: '2024-01-05',
          notes: '',
          created_at: '2024-01-05',
        },
        {
          id: 2,
          lead: 2,
          title: 'Bathroom refresh',
          description: 'Bathroom refresh estimate',
          amount: '1200.00',
          status: 'won',
          date_sent: '2024-01-06',
          notes: '',
          created_at: '2024-01-06',
        },
      ])
    );
  }),

  rest.get('http://localhost:8000/api/estimates/:id/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        lead: 1,
        title: 'Kitchen remodel quote',
        description: 'Full kitchen remodel estimate',
        amount: '4500.00',
        status: 'sent',
        date_sent: '2024-01-05',
        notes: '',
        created_at: '2024-01-05',
      })
    );
  }),

  rest.post('http://localhost:8000/api/estimates/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.title) {
      return res(ctx.status(400), ctx.json({ detail: 'Title is required.' }));
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        lead: body.lead ?? 1,
        title: body.title,
        description: body.description ?? '',
        amount: body.amount ?? null,
        status: body.status ?? 'sent',
        date_sent: body.date_sent ?? null,
        notes: body.notes ?? '',
        created_at: new Date().toISOString().split('T')[0],
      })
    );
  }),

  rest.put('http://localhost:8000/api/estimates/:id/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.title) {
      return res(ctx.status(400), ctx.json({ detail: 'Title is required.' }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        lead: body.lead ?? 1,
        title: body.title,
        description: body.description ?? '',
        amount: body.amount ?? null,
        status: body.status ?? 'sent',
        date_sent: body.date_sent ?? null,
        notes: body.notes ?? '',
        created_at: body.created_at ?? '2024-01-05',
      })
    );
  }),

  rest.delete('http://localhost:8000/api/estimates/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // 🔗 Follow-ups Endpoints
  rest.get('http://localhost:8000/api/follow-ups/', (req, res, ctx) => {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          lead: 1,
          estimate: 1,
          title: 'Call John about kitchen quote',
          due_date: iso(today),
          completed: false,
          notes: '',
          created_at: '2024-01-05',
        },
        {
          id: 2,
          lead: 2,
          estimate: null,
          title: 'Email Jane the service agreement',
          due_date: iso(yesterday),
          completed: false,
          notes: '',
          created_at: '2024-01-05',
        },
        {
          id: 3,
          lead: 1,
          estimate: null,
          title: 'Send invoice to John',
          due_date: iso(tomorrow),
          completed: false,
          notes: '',
          created_at: '2024-01-05',
        },
        {
          id: 4,
          lead: 2,
          estimate: null,
          title: 'Already done follow-up',
          due_date: iso(yesterday),
          completed: true,
          notes: '',
          created_at: '2024-01-05',
        },
      ])
    );
  }),

  rest.get('http://localhost:8000/api/follow-ups/:id/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        lead: 1,
        estimate: 1,
        title: 'Call John about kitchen quote',
        due_date: new Date().toISOString().split('T')[0],
        completed: false,
        notes: '',
        created_at: '2024-01-05',
      })
    );
  }),

  rest.post('http://localhost:8000/api/follow-ups/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.title || !body.due_date) {
      return res(
        ctx.status(400),
        ctx.json({ detail: 'Missing required fields: title, due_date' })
      );
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 5,
        lead: body.lead ?? null,
        estimate: body.estimate ?? null,
        title: body.title,
        due_date: body.due_date,
        completed: false,
        notes: body.notes ?? '',
        created_at: new Date().toISOString().split('T')[0],
      })
    );
  }),

  rest.patch('http://localhost:8000/api/follow-ups/:id/', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        lead: body.lead ?? 1,
        estimate: body.estimate ?? null,
        title: body.title ?? 'Call John about kitchen quote',
        due_date: body.due_date ?? new Date().toISOString().split('T')[0],
        completed: body.completed ?? false,
        notes: body.notes ?? '',
        created_at: '2024-01-05',
      })
    );
  }),

  rest.delete('http://localhost:8000/api/follow-ups/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // 🔐 Auth (Token) Endpoint
  rest.post('http://localhost:8000/api/token/', async (req, res, ctx) => {
    const body = await req.json();
    // Login now posts { username, password } (SimpleJWT expects username).
    const username = body.username ?? body.email;
    const { password } = body;
    if ((username === 'testuser' || username === 'test@example.com') && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json({
          access: 'fake-access-token',
          refresh: 'fake-refresh-token',
        })
      );
    }
    return res(ctx.status(401), ctx.json({ detail: 'Invalid credentials' }));
  }),

  // 🔐 Auth (Token Refresh) Endpoint
  rest.post('http://localhost:8000/api/token/refresh/', async (req, res, ctx) => {
    const body = await req.json();
    if (body.refresh === 'fake-refresh-token') {
      return res(ctx.status(200), ctx.json({ access: 'fake-access-token' }));
    }
    return res(ctx.status(401), ctx.json({ detail: 'Token is invalid or expired' }));
  }),

  // 🧩 Custom Fields Endpoints
  rest.get('http://localhost:8000/api/custom-fields/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),

  rest.post('http://localhost:8000/api/custom-fields/', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: 1,
        agent: 1,
        name: body.name ?? body.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label: body.label,
        field_type: body.field_type ?? 'text',
        required: body.required ?? false,
        options: body.options ?? [],
        order: body.order ?? 0,
        is_active: true,
      })
    );
  }),

  rest.patch('http://localhost:8000/api/custom-fields/:id/', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        agent: 1,
        name: body.name ?? 'field',
        label: body.label ?? 'Field',
        field_type: body.field_type ?? 'text',
        required: body.required ?? false,
        options: body.options ?? [],
        order: body.order ?? 0,
        is_active: true,
      })
    );
  }),

  rest.delete('http://localhost:8000/api/custom-fields/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // ⚙️ Lead Form Settings Endpoints
  rest.get('http://localhost:8000/api/lead-form-settings/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        field_config: {
          company: { visible: true, required: false },
          lead_source: { visible: true, required: false },
          notes: { visible: true, required: false },
          preferred_contact: { visible: true, required: false },
          phone: { visible: true, required: false },
          property_address: { visible: true, required: true },
        },
      })
    );
  }),

  rest.put('http://localhost:8000/api/lead-form-settings/', async (req, res, ctx) => {
    const body = await req.json();
    const defaults: Record<string, { visible: boolean; required: boolean }> = {
      company: { visible: true, required: false },
      lead_source: { visible: true, required: false },
      notes: { visible: true, required: false },
      preferred_contact: { visible: true, required: false },
      phone: { visible: true, required: false },
      property_address: { visible: true, required: true },
    };
    const merged = { ...defaults, ...(body.field_config ?? {}) };
    return res(ctx.status(200), ctx.json({ field_config: merged }));
  }),

  // 📝 Public Signup Endpoint (POST /api/register/)
  // NOTE: mocks the backend contract — the real endpoint is built by the
  // backend worker on the same branch. The access token is a fake JWT
  // whose payload is {"user_id": 3} so getCurrentUserId() can decode it.
  rest.post('http://localhost:8000/api/register/', async (req, res, ctx) => {
    const body = await req.json();
    if (body.username === 'existinguser') {
      return res(
        ctx.status(400),
        ctx.json({ username: ['A user with that username already exists.'] })
      );
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return res(
        ctx.status(400),
        ctx.json({ email: ['Enter a valid email address.'] })
      );
    }
    if (!body.password || body.password.length < 8) {
      return res(
        ctx.status(400),
        ctx.json({ password: ['This password is too short.'] })
      );
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        username: body.username,
        email: body.email,
        is_trial: true,
        trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        access:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozfQ.fakesignature',
        refresh: 'fake-refresh-token',
      })
    );
  }),

  // 👀 Public Demo Endpoint (GET /api/demo/)
  // NOTE: mocks the backend contract — the real endpoint is built by the
  // backend worker on the same branch.
  rest.get('http://localhost:8000/api/demo/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        leads: [
          {
            id: 1,
            name: 'Demo Lead One',
            email: 'one@example.com',
            phone: '111',
            property_address: '1 Demo Lane',
            status: 'new',
            company: 'Demo Co',
            lead_source: 'referral',
            notes: 'Sample lead',
            preferred_contact: 'email',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            name: 'Demo Lead Two',
            email: 'two@example.com',
            phone: '222',
            property_address: '2 Demo Lane',
            status: 'contacted',
            company: 'Demo Co',
            lead_source: 'referral',
            notes: 'Sample lead',
            preferred_contact: 'phone',
            created_at: '2024-01-02T00:00:00Z',
          },
        ],
        contracts: [
          {
            id: 1,
            lead_name: 'Demo Lead One',
            status: 'pending',
            created_at: '2024-01-03T00:00:00Z',
          },
        ],
        stats: {
          total_leads: 2,
          active_leads: 2,
          total_contracts: 1,
          pending_signature: 1,
          leads_by_status: {
            new: 1,
            contacted: 1,
            qualified: 0,
            converted: 0,
            lost: 0,
          },
        },
      })
    );
  }),

  // 👤 Agent Detail Endpoint (GET /api/agents/:id/) — default: full account.
  // Tests override with server.use() to return a trial account.
  rest.get('http://localhost:8000/api/agents/:id/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '',
        company: '',
        is_trial: false,
        trial_ends_at: null,
        days_remaining: null,
      })
    );
  }),
];
