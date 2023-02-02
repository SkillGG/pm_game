import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetterShufflerComponent } from './letter-shuffler.component';

describe('LetterShufflerComponent', () => {
  let component: LetterShufflerComponent;
  let fixture: ComponentFixture<LetterShufflerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LetterShufflerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetterShufflerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
