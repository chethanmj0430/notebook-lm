import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { PdfService } from '../services/pdf-service';
import { ThemeService } from '../services/theme-service';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chat-interface',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-interface.html',
  styleUrl: './chat-interface.scss',
  encapsulation: ViewEncapsulation.None
})
export class ChatInterface implements OnInit, AfterViewChecked {
currentMessage: string = '';
  messages: Message[] = [];
  newMessage: string = '';
  @ViewChild('messagesDisplay') private messagesDisplayRef!: ElementRef;
  isLoadingResponse: boolean = false;
  currentTheme$!: Observable<'light' | 'dark'>;
  currentPdfName$: Observable<string | null> | undefined;
  private readonly CHAT_HISTORY_KEY = 'chatHistory';
  isPdfLoaded$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private themeService: ThemeService,
    private pdfService: PdfService ) { 
      this.currentPdfName$ = this.pdfService.currentPdfName$;
      this.currentTheme$ = this.themeService.currentTheme$;
      this.isPdfLoaded$ = this.pdfService.currentPdfName$.pipe(map(pdfName => !!pdfName)
    );
    }

  ngOnInit(): void {
    // this.loadChatHistory();
    this.messages.push({
      text: "Hello! wait until the PDF is uplaoded.",
      sender: 'bot',
      timestamp: new Date()
    });
    this.pdfService.currentPdfName$.subscribe(name => {
        if (name && !(this.messages.length === 1 && this.messages[0].text.includes("Upload a PDF"))) {
            if (!this.messages.some(m => m.sender === 'bot' && m.text.includes(`"${name}"`) && m.text.includes("questions about"))) {
              this.messages.push({
                  text: `You can now ask questions about "${name}".`,
                  sender: 'bot',
                  timestamp: new Date()
              });
            this.saveChatHistory();
            }
        } else if (!name && this.messages.length > 1) { 
             this.messages.push({
                text: "No PDF is currently loaded. Please upload a PDF to ask document-specific questions.",
                sender: 'bot',
                timestamp: new Date()
            });
        }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const userMessage = this.newMessage.trim();
      this.messages.push(
        {
          text: userMessage,
          sender: 'user',
          timestamp: new Date()
        });
      this.saveChatHistory();
      // this.simulateBotResponse(this.newMessage.trim());
      this.isLoadingResponse = true;

      this.newMessage = '';

      if (!this.pdfService.getPdfName()) {
        const botNoPdfMessage: Message = {
          text: "Please upload a PDF first to ask document-specific questions.",
          sender: 'bot',
          timestamp: new Date()
        };
        this.messages.push(botNoPdfMessage);
        this.saveChatHistory();
        this.isLoadingResponse = false;
        return;
      }

      this.http.post<{ response: string }>(`${environment.backendUrl}/chat`, { message: userMessage })
        .subscribe({
          next: (response) => {
            const botResponse: Message = {
              text: response.response,
              sender: 'bot',
              timestamp: new Date()
            };
            this.messages.push(botResponse);
            this.saveChatHistory();
            this.isLoadingResponse = false;

          },
          error: (err) => {
            console.error('Error sending message to backend:', err);
            const errorMessage = "Oops! I couldn't get a response from the AI. Please try again.";
            const botErrorMessage: Message = {
              text: errorMessage,
              sender: 'bot',
              timestamp: new Date()
            };
            this.messages.push(botErrorMessage);
            this.saveChatHistory();
            this.isLoadingResponse = false;
          }
        });

      this.newMessage = ''; 
    
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private simulateBotResponse(userMessage: string): void {
    let botResponse = "I'm still learning! Please upload a PDF to get started.";
    if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
      botResponse = "Hello there! How can I help you with your PDF today?";
    } else if (userMessage.toLowerCase().includes("pdf")) {
      botResponse = "Yes, please upload a PDF document, and I'll help you extract information or answer questions about its content.";
    }

    setTimeout(() => { 
      this.messages.push({
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      });
      
    }, 500);
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesDisplayRef.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Scroll to bottom failed:', err);
    }
  }

   private loadChatHistory(): void {
    const history = localStorage.getItem(this.CHAT_HISTORY_KEY);
    if (history) {
      this.messages = JSON.parse(history).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp) 
      }));
    }
  }

  private saveChatHistory(): void {
    const historyToSave = this.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString() 
    }));
    localStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(historyToSave));
  }

  clearChat(): void { 
    if (confirm('Are you sure you want to clear the entire chat history?')) {
      this.messages = [];
      localStorage.removeItem(this.CHAT_HISTORY_KEY);
      console.log(localStorage)
      this.pdfService.clearPdfName(); 
      this.messages.push({
        text: "Hello! Upload a PDF using the upload section above to start asking questions about it. Once uploaded, its name will appear in the header.",
        sender: 'bot',
        timestamp: new Date()
      });
      // this.saveChatHistory();
    }
  }
}
